import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Building,
  Home,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';
import type { z } from 'zod';
import {
  parseFile,
  bulkInsert,
  downloadErrorReport,
  downloadInsertFailures,
  type ParseResult,
  type InsertResult,
  type UploadTable,
} from '@/services/uploadService';
import {
  communeUploadSchema,
  mapCommuneToTownHall,
} from '@/lib/schemas/communes.schema';
import {
  housingUploadSchema,
  mapHousingToDb,
} from '@/lib/schemas/housings.schema';
import {
  vehicleUploadSchema,
  mapVehicleToDb,
} from '@/lib/schemas/vehicles.schema';

// ──────────────────────────────────────────────────────────────────────
// Generic UploadZone — handles full lifecycle for one upload type.
// ──────────────────────────────────────────────────────────────────────

type Step = 'idle' | 'parsing' | 'preview' | 'inserting' | 'done' | 'error';

interface UploadZoneProps<T> {
  title: string;
  description: string;
  icon: React.ElementType;
  schema: z.ZodType<T>;
  table: UploadTable;
  mapToDb: (row: T) => Record<string, unknown>;
  acceptedExts: string;
}

function UploadZone<T>({
  title,
  description,
  icon: Icon,
  schema,
  table,
  mapToDb,
  acceptedExts,
}: UploadZoneProps<T>) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult<T> | null>(null);
  const [progress, setProgress] = useState({ inserted: 0, total: 0 });
  const [insertResult, setInsertResult] = useState<InsertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setFileName('');
    setParseResult(null);
    setProgress({ inserted: 0, total: 0 });
    setInsertResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setStep('parsing');
      setError(null);
      try {
        const result = await parseFile<T>(file, schema);
        setParseResult(result);
        setStep('preview');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de parsing');
        setStep('error');
      }
    },
    [schema],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleConfirm = useCallback(async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    setStep('inserting');
    setError(null);
    setProgress({ inserted: 0, total: parseResult.rows.length });
    try {
      const dbRows = parseResult.rows.map(mapToDb);
      const result = await bulkInsert(table, dbRows, (inserted, total) => {
        setProgress({ inserted, total });
      });
      setInsertResult(result);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'insertion");
      setStep('error');
    }
  }, [parseResult, mapToDb, table]);

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-3">
          <Icon className="text-[var(--highlight-text)]" />
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </div>

      {step === 'idle' && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={handleDrop}
          className={`flex justify-center items-center w-full h-32 px-4 transition bg-white/50 dark:bg-[var(--bg-card-solid)]/50 border-2 ${
            isDragOver
              ? 'border-[var(--highlight-text)]'
              : 'border-gray-300 dark:border-slate-600'
          } border-dashed rounded-xl cursor-pointer hover:border-gray-400 dark:hover:border-slate-500`}
        >
          <span className="flex items-center space-x-2">
            <UploadCloud
              className={`mx-auto h-10 w-10 ${
                isDragOver
                  ? 'text-[var(--highlight-text)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            />
            <span className="font-medium text-[var(--text-secondary)] text-sm">
              Glissez et déposez votre fichier ici, ou{' '}
              <span className="text-orange-600 dark:text-orange-400 underline">
                parcourez
              </span>
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedExts}
            className="hidden"
            onChange={handleSelect}
          />
        </label>
      )}

      {step === 'parsing' && (
        <div className="flex items-center gap-3 px-4 py-6 rounded-xl bg-[var(--bg-card-solid)]/50 border border-[var(--border-subtle)]">
          <Loader2 className="animate-spin text-[var(--accent-primary)]" size={20} />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Analyse de {fileName}…
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Lecture et validation en cours
            </p>
          </div>
        </div>
      )}

      {step === 'preview' && parseResult && (
        <PreviewPanel
          fileName={fileName}
          parseResult={parseResult}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}

      {step === 'inserting' && (
        <div className="flex flex-col gap-3 px-4 py-5 rounded-xl bg-[var(--bg-card-solid)]/50 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-[var(--accent-primary)]" size={18} />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Import en cours… {progress.inserted} / {progress.total}
            </p>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all"
              style={{
                width:
                  progress.total === 0
                    ? '0%'
                    : `${Math.round((progress.inserted / progress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {step === 'done' && insertResult && (
        <DonePanel
          insertResult={insertResult}
          parseResult={parseResult}
          tableLabel={title}
          onReset={reset}
        />
      )}

      {step === 'error' && (
        <div className="flex flex-col gap-3 px-4 py-5 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Échec de l'opération
            </p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] break-words">
            {error}
          </p>
          <button
            onClick={reset}
            className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90"
          >
            <RotateCcw size={14} />
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Preview panel — shows parse stats + sample table + confirm button
// ──────────────────────────────────────────────────────────────────────

interface PreviewPanelProps<T> {
  fileName: string;
  parseResult: ParseResult<T>;
  onConfirm: () => void;
  onCancel: () => void;
}

function PreviewPanel<T>({
  fileName,
  parseResult,
  onConfirm,
  onCancel,
}: PreviewPanelProps<T>) {
  const { rows, errors, total } = parseResult;
  const headers = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0] as Record<string, unknown>).slice(0, 8);
  }, [rows]);

  const sample = rows.slice(0, 10);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 rounded-xl bg-[var(--bg-card-solid)]/50 border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {fileName}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {total} lignes lues ·{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {rows.length} valides
            </span>
            {errors.length > 0 && (
              <>
                {' · '}
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {errors.length} erreurs
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
          aria-label="Annuler"
        >
          <X size={18} />
        </button>
      </div>

      {sample.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[var(--border-subtle)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--bg-card-solid)]/70">
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-[var(--border-subtle)]"
                >
                  {headers.map((h) => {
                    const v = (row as Record<string, unknown>)[h];
                    const display =
                      v === null || v === undefined
                        ? ''
                        : Array.isArray(v)
                        ? v.join(', ')
                        : typeof v === 'object'
                        ? JSON.stringify(v)
                        : String(v);
                    return (
                      <td
                        key={h}
                        className="px-2 py-1 text-[var(--text-primary)] whitespace-nowrap max-w-[180px] truncate"
                        title={display}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > sample.length && (
            <p className="text-[10px] text-[var(--text-secondary)] px-2 py-1 bg-[var(--bg-card-solid)]/40">
              Aperçu des 10 premières lignes (sur {rows.length})
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
            {errors.length} ligne(s) rejetée(s) à la validation
          </p>
          <ul className="text-[11px] text-[var(--text-secondary)] space-y-0.5 max-h-32 overflow-y-auto">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i} className="truncate">
                <span className="font-mono">L.{e.row}</span> — {e.reason}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-[var(--text-muted)] italic">
                … et {errors.length - 5} de plus (téléchargeable après import)
              </li>
            )}
          </ul>
          <button
            onClick={() => downloadErrorReport(errors, 'erreurs-validation.csv')}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
          >
            <Download size={12} />
            Télécharger le rapport d'erreurs
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onConfirm}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 size={16} />
          Confirmer l'import ({rows.length})
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-solid)]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Done panel — final summary + downloads
// ──────────────────────────────────────────────────────────────────────

interface DonePanelProps<T> {
  insertResult: InsertResult;
  parseResult: ParseResult<T> | null;
  tableLabel: string;
  onReset: () => void;
}

function DonePanel<T>({
  insertResult,
  parseResult,
  tableLabel,
  onReset,
}: DonePanelProps<T>) {
  const { inserted, failed } = insertResult;
  const validationErrors = parseResult?.errors ?? [];
  const allClean = failed.length === 0 && validationErrors.length === 0;

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-4 rounded-xl border ${
        allClean
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-amber-500/10 border-amber-500/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {allClean ? (
          <CheckCircle2 className="text-emerald-500" size={22} />
        ) : (
          <AlertTriangle className="text-amber-500" size={22} />
        )}
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {allClean ? 'Import terminé' : 'Import partiellement réussi'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {inserted} importés
            </span>
            {failed.length > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {failed.length} échoués
                </span>
              </>
            )}
            {validationErrors.length > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {validationErrors.length} rejetés (validation)
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {validationErrors.length > 0 && (
          <button
            onClick={() =>
              downloadErrorReport(
                validationErrors,
                `erreurs-validation-${tableLabel.toLowerCase().replace(/\s+/g, '-')}.csv`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
          >
            <Download size={14} />
            Erreurs de validation
          </button>
        )}
        {failed.length > 0 && (
          <button
            onClick={() =>
              downloadInsertFailures(
                failed,
                `echecs-insertion-${tableLabel.toLowerCase().replace(/\s+/g, '-')}.csv`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
          >
            <Download size={14} />
            Échecs d'insertion
          </button>
        )}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90"
        >
          <RotateCcw size={14} />
          Importer un autre fichier
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Reports zone — placeholder (out of scope)
// ──────────────────────────────────────────────────────────────────────

const ReportsPlaceholder: React.FC = () => (
  <div className="glass-card p-6 flex flex-col gap-4 opacity-90">
    <div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 flex items-center gap-3">
        <FileText className="text-[var(--highlight-text)]" />
        Rapports de Performance
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">
        Chargez les rapports hebdomadaires ou mensuels pour analyse. Formats prévus : PDF, XLSX.
      </p>
    </div>
    <div className="flex items-center justify-center w-full h-32 px-4 rounded-xl bg-white/30 dark:bg-[var(--bg-card-solid)]/30 border-2 border-dashed border-gray-300 dark:border-slate-700">
      <div className="text-center">
        <FileText className="mx-auto h-8 w-8 text-[var(--text-muted)] mb-1" />
        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          Bientôt disponible
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          Module en cours de développement
        </p>
      </div>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────
// Main tab
// ──────────────────────────────────────────────────────────────────────

const UploadTab: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <header className="mb-4 md:mb-8">
        <h2 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)]">
          Importer des Données
        </h2>
        <p className="text-sm md:text-lg text-[var(--text-secondary)] mt-1 md:mt-2">
          Mettez à jour l'application avec vos derniers fichiers de données.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <UploadZone
          title="Données des Communes"
          description="Importez la liste des communes avec leurs statuts, populations, et informations de contact. Formats acceptés : CSV, JSON, XLSX."
          icon={Building}
          schema={communeUploadSchema}
          table="town_halls"
          mapToDb={mapCommuneToTownHall}
          acceptedExts=".csv,.json,.xlsx,.xls"
        />
        <UploadZone
          title="Logements Opérationnels"
          description="Mettez à jour la base de données des logements utilisés par les équipes. Formats acceptés : CSV, XLSX, JSON."
          icon={Home}
          schema={housingUploadSchema}
          table="housings"
          mapToDb={mapHousingToDb}
          acceptedExts=".csv,.xlsx,.xls,.json"
        />
        <UploadZone
          title="Flotte de Véhicules"
          description="Importez les données à jour de la flotte, incluant kilométrage et dates de révision. Formats acceptés : CSV, XLSX, JSON."
          icon={Truck}
          schema={vehicleUploadSchema}
          table="vehicles"
          mapToDb={mapVehicleToDb}
          acceptedExts=".csv,.xlsx,.xls,.json"
        />
        <ReportsPlaceholder />
      </div>
    </section>
  );
};

export default UploadTab;
