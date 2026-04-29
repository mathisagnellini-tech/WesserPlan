import { describe, expect, it } from 'vitest';
import { dbStatusToUi, uiStatusToDb } from './communeStatus';

describe('uiStatusToDb', () => {
  it('maps every UI status to a stable DB enum', () => {
    expect(uiStatusToDb('pas_demande')).toBe('pending');
    expect(uiStatusToDb('informe')).toBe('in_progress');
    expect(uiStatusToDb('refuse')).toBe('refused');
    expect(uiStatusToDb('telescope')).toBe('action_required');
    expect(uiStatusToDb('fait')).toBe('accepted');
  });
});

describe('dbStatusToUi', () => {
  it('round-trips known DB statuses back to the UI value', () => {
    expect(dbStatusToUi('pending')).toBe('pas_demande');
    expect(dbStatusToUi('in_progress')).toBe('informe');
    expect(dbStatusToUi('refused')).toBe('refuse');
    expect(dbStatusToUi('action_required')).toBe('telescope');
    expect(dbStatusToUi('accepted')).toBe('fait');
  });

  it('falls back to pas_demande on null / unknown', () => {
    expect(dbStatusToUi(null)).toBe('pas_demande');
    expect(dbStatusToUi(undefined)).toBe('pas_demande');
    expect(dbStatusToUi('garbage')).toBe('pas_demande');
  });

  it('round-trips through ui→db→ui losslessly', () => {
    for (const ui of ['pas_demande', 'informe', 'refuse', 'telescope', 'fait'] as const) {
      expect(dbStatusToUi(uiStatusToDb(ui))).toBe(ui);
    }
  });
});
