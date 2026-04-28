import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { supabasePlan } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';

/**
 * Generic upload pipeline:
 *   1. parseFile: CSV/XLSX/JSON → unknown[] → Zod-validate → ParseResult<T>
 *   2. bulkInsert: validated rows → Supabase (batched, audit-stamped)
 *   3. downloadErrorReport: rejected rows → CSV download
 */

export interface ParseError {
  row: number;
  reason: string;
  raw: unknown;
}

export interface ParseResult<T> {
  rows: T[];
  errors: ParseError[];
  total: number;
}

export interface InsertFailure {
  row: Record<string, unknown>;
  reason: string;
}

export interface InsertResult {
  inserted: number;
  failed: InsertFailure[];
}

/** All upload-target tables live in the `plan` schema. */
export type UploadTable = 'town_halls' | 'housings' | 'vehicles';

export const SUPPORTED_EXTS = ['csv', 'xlsx', 'xls', 'json'] as const;
export type SupportedExt = (typeof SUPPORTED_EXTS)[number];

/** Hard cap on uploaded file size. Above this we refuse before reading the
 * file at all — large CSV/XLSX files will block the main thread when parsed
 * synchronously by Papa/XLSX. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export class UploadAbortedError extends Error {
  constructor(message = "Opération annulée") {
    super(message);
    this.name = 'UploadAbortedError';
  }
}

function getExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export function isSupportedExt(ext: string): ext is SupportedExt {
  return (SUPPORTED_EXTS as readonly string[]).includes(ext);
}

/** Cheap, synchronous pre-flight before reading file bytes. Throws on
 * unsupported extension or oversized file. Used by the UI to fail fast. */
export function validateFile(file: File): void {
  const ext = getExt(file.name);
  if (!isSupportedExt(ext)) {
    throw new Error(
      `Format non supporté: .${ext || '(inconnu)'}. Formats acceptés: ${SUPPORTED_EXTS.join(', ')}.`,
    );
  }
  if (file.size === 0) {
    throw new Error('Fichier vide.');
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    const maxMb = (MAX_FILE_BYTES / 1024 / 1024).toFixed(0);
    throw new Error(`Fichier trop volumineux (${mb} Mo). Limite: ${maxMb} Mo.`);
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadAbortedError();
  }
}

/** Parse + validate a file against a Zod schema. */
export async function parseFile<T>(
  file: File,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<ParseResult<T>> {
  validateFile(file);
  throwIfAborted(signal);

  const ext = getExt(file.name) as SupportedExt;
  let raw: unknown[] = [];

  if (ext === 'csv') {
    const text = await file.text();
    throwIfAborted(signal);
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
    });
    raw = parsed.data;
  } else if (ext === 'xlsx' || ext === 'xls') {
    const buf = await file.arrayBuffer();
    throwIfAborted(signal);
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      throw new Error('Le fichier Excel ne contient aucune feuille.');
    }
    const ws = wb.Sheets[sheetName];
    raw = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
  } else if (ext === 'json') {
    const text = await file.text();
    throwIfAborted(signal);
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(
        `JSON invalide: ${e instanceof Error ? e.message : 'erreur de parsing'}`,
      );
    }
    raw = Array.isArray(data) ? data : [data];
  }

  throwIfAborted(signal);

  const rows: T[] = [];
  const errors: ParseError[] = [];

  raw.forEach((entry, i) => {
    const result = schema.safeParse(entry);
    if (result.success) {
      rows.push(result.data);
    } else {
      errors.push({
        row: i + 2, // header counts as row 1
        reason: result.error.issues
          .map((e) => `${e.path.join('.') || '<root>'}: ${e.message}`)
          .join('; '),
        raw: entry,
      });
    }
  });

  return { rows, errors, total: raw.length };
}

const BATCH_SIZE = 500;

/**
 * Bulk-insert rows into a `plan.<table>`, batched and audit-stamped.
 * On batch failure, retries one-by-one to identify the offending rows.
 * Honours an AbortSignal between batches and between per-row retries.
 */
export async function bulkInsert(
  table: UploadTable,
  rows: Record<string, unknown>[],
  onProgress?: (inserted: number, total: number) => void,
  signal?: AbortSignal,
): Promise<InsertResult> {
  let inserted = 0;
  const failed: InsertFailure[] = [];
  const total = rows.length;
  onProgress?.(0, total);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    throwIfAborted(signal);
    const slice = rows.slice(i, i + BATCH_SIZE);
    const stamped = slice.map((r) => withAudit(r, 'insert'));

    const { error } = await supabasePlan.from(table).insert(stamped);

    if (error) {
      // Fall back to per-row inserts to surface the bad rows
      for (const row of slice) {
        throwIfAborted(signal);
        const { error: oneErr } = await supabasePlan
          .from(table)
          .insert([withAudit(row, 'insert')]);
        if (oneErr) {
          failed.push({ row, reason: oneErr.message });
        } else {
          inserted++;
        }
        onProgress?.(inserted, total);
      }
    } else {
      inserted += slice.length;
      onProgress?.(inserted, total);
    }
  }

  return { inserted, failed };
}

function triggerCsvDownload(csv: string, filename: string): void {
  // BOM so Excel detects UTF-8
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Triggers a browser download of the error rows as CSV. */
export function downloadErrorReport(
  errors: ParseError[],
  filename = 'erreurs.csv',
): void {
  if (errors.length === 0) return;
  const csv = Papa.unparse(
    errors.map((e) => ({
      row: e.row,
      reason: e.reason,
      raw: JSON.stringify(e.raw),
    })),
  );
  triggerCsvDownload(csv, filename);
}

/** Triggers a browser download of insert failures (post-parse, DB-level). */
export function downloadInsertFailures(
  failed: InsertFailure[],
  filename = 'echecs-insertion.csv',
): void {
  if (failed.length === 0) return;
  const csv = Papa.unparse(
    failed.map((f, i) => ({
      index: i + 1,
      reason: f.reason,
      row: JSON.stringify(f.row),
    })),
  );
  triggerCsvDownload(csv, filename);
}
