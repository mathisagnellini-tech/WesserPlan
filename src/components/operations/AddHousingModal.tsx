import React, { useState, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Upload, Loader2, CheckCircle2, Save, AlertCircle, ScanLine } from 'lucide-react';
import type { Housing } from './types';
import { getWeekNumberLabel } from './helpers';
import { housingsService } from '@/services/housingsService';
import { geocodeAddress } from '@/services/geocodingService';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { Tooltip } from '@/components/ui/Tooltip';
import { reporter } from '@/lib/observability';

// Local form state (UI shape, before mapping to HousingRow for the DB)
interface HousingFormState {
    name?: string;
    date?: string;          // start date (yyyy-mm-dd)
    address?: string;
    people?: number;
    nights?: number;
    cost?: number;
    channel?: string;
    org?: string;
    ownerName?: string;
    owner?: string;         // phone
    region?: string;
    dept?: string;
    lat?: number;
    lng?: number;
    comment?: string;
    amenities?: string[];
}

interface ValidationErrors {
    name?: string;
    address?: string;
    date?: string;
    people?: string;
    nights?: string;
    cost?: string;
    region?: string;
    dept?: string;
    org?: string;
}

const initialForm: HousingFormState = {
    org: 'MSF',
    amenities: [],
    people: 5,
    nights: 5,
    date: new Date().toISOString().split('T')[0],
    region: 'Nouvelle-Aquitaine',
    dept: '33',
    lat: 0,
    lng: 0,
    channel: 'Direct',
};

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
}

function validate(form: HousingFormState): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!form.name || !form.name.trim()) errors.name = 'Nom requis';
    if (!form.address || !form.address.trim()) errors.address = 'Adresse requise';
    if (!form.date) errors.date = 'Date de début requise';
    if (!form.region || !form.region.trim()) errors.region = 'Région requise';
    if (!form.dept || !form.dept.trim()) errors.dept = 'Département requis';
    if (!form.org || !form.org.trim()) errors.org = 'Organisation requise';
    if (!form.people || form.people <= 0) errors.people = 'Capacité > 0';
    if (!form.nights || form.nights <= 0) errors.nights = 'Nuits > 0';
    if (form.cost === undefined || form.cost < 0) errors.cost = 'Coût invalide';
    return errors;
}

export const AddHousingModal: React.FC<{
    isOpen: boolean;
    initialMode: 'manual' | 'scan';
    onClose: () => void;
    onCreated: (h: Housing) => void | Promise<void>;
}> = ({ isOpen, initialMode, onClose, onCreated }) => {
    const [mode, setMode] = useState<'manual' | 'scan'>(initialMode);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
    const [formData, setFormData] = useState<HousingFormState>(initialForm);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const titleId = useId();
    const closeRef = useRef<HTMLButtonElement>(null);
    const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const { dialogRef } = useDialogA11y({ isOpen, onClose, initialFocusRef: closeRef });

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setScanStatus('idle');
            setFormData(initialForm);
            setErrors({});
            setSubmitError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialMode]);

    // Cancel any pending scan timers when the modal closes / unmounts
    useEffect(() => {
        if (!isOpen) {
            scanTimersRef.current.forEach(clearTimeout);
            scanTimersRef.current = [];
        }
        return () => {
            scanTimersRef.current.forEach(clearTimeout);
            scanTimersRef.current = [];
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const validationErrors = validate(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        const address = formData.address!.trim();

        const nights = Number(formData.nights);
        const startDate = formData.date!;
        const endDate = addDays(startDate, nights);
        const cost = Number(formData.cost) || 0;

        setIsSubmitting(true);
        try {
            const geo = await geocodeAddress(address);
            if (!geo) {
                setErrors(prev => ({
                    ...prev,
                    address: 'Impossible de localiser cette adresse — vérifiez la saisie',
                }));
                setIsSubmitting(false);
                return;
            }

            const dbRow = {
                name: formData.name!.trim(),
                lead: 'Moi',
                region: formData.region!,
                dept: formData.dept!,
                org: formData.org!,
                people: Number(formData.people),
                nights,
                date_start: startDate,
                date_end: endDate,
                cost_reservation: cost,
                cost_additional: 0,
                has_insurance: false,
                cost_total: cost,
                cost_final: cost,
                receipt_ok: false,
                channel: formData.channel ?? 'Direct',
                address,
                team_note: formData.comment ?? '',
                status: 'planned',
                refund_amount: 0,
                lat: geo.lat,
                lng: geo.lng,
            };

            const created = await housingsService.create(dbRow);
            await onCreated(created);
            onClose();
        } catch (err) {
            reporter.error('Failed to create housing', err, { source: 'operations/AddHousingModal' });
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création du logement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScanFile = () => {
        setScanStatus('scanning');
        const t1 = setTimeout(() => {
            setScanStatus('done');
            setFormData({
                ...initialForm,
                name: "Gîte Airbnb 'Le Petit Bonheur'",
                address: '12 Rue des Lilas, 33000 Bordeaux',
                cost: 450,
                nights: 4,
                ownerName: 'Airbnb Receipt #4920',
                channel: 'Airbnb',
                people: 2,
                org: 'MSF',
                date: new Date().toISOString().split('T')[0],
            });
            const t2 = setTimeout(() => setMode('manual'), 800);
            scanTimersRef.current.push(t2);
        }, 2000);
        scanTimersRef.current.push(t1);
    };

    const fieldClass = (hasError?: string) => `field-input ${hasError ? 'is-error' : ''}`;

    return createPortal(
        <div className="app-surface fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="modal-shell relative w-full max-w-lg flex flex-col max-h-[90vh] outline-none"
            >
                {/* Header with subtle accent strip */}
                <div className="modal-accent-strip px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25 shrink-0">
                            {mode === 'manual' ? <Save size={16} strokeWidth={2.2} /> : <ScanLine size={16} strokeWidth={2.2} />}
                        </div>
                        <div className="min-w-0">
                            <h3 id={titleId} className="display text-[var(--text-primary)] text-lg leading-none">
                                {mode === 'manual' ? 'Nouveau logement' : 'Scanner un reçu'}
                            </h3>
                            <p className="eyebrow mt-1 leading-none">
                                {mode === 'manual' ? 'saisie manuelle' : 'extraction automatique'}
                            </p>
                        </div>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="btn-ghost !p-2"
                    >
                        <X size={16} strokeWidth={2.2} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {mode === 'scan' && (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            {scanStatus === 'idle' && (
                                <Tooltip comingSoon content="Le scan de reçu par IA est en cours d'intégration. Saisissez les informations manuellement pour le moment.">
                                    <button
                                        type="button"
                                        onClick={handleScanFile}
                                        className="w-full h-44 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition border border-dashed border-[var(--border-subtle)] bg-slate-50/60 dark:bg-slate-800/40 hover:border-orange-300 hover:bg-orange-50/60 dark:hover:bg-orange-500/10 active:translate-y-[1px]"
                                    >
                                        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] flex items-center justify-center mb-3 shadow-sm">
                                            <Upload size={18} strokeWidth={2.2} className="text-orange-600" />
                                        </div>
                                        <p className="text-[13px] font-medium text-[var(--text-primary)] tracking-tight">
                                            Cliquez pour téléverser un reçu
                                        </p>
                                        <p className="eyebrow mt-1">PDF, JPG, PNG</p>
                                    </button>
                                </Tooltip>
                            )}
                            {scanStatus === 'scanning' && (
                                <div className="py-12">
                                    <Loader2 size={36} className="text-orange-600 animate-spin mb-4 mx-auto" strokeWidth={2.2} />
                                    <p className="text-[15px] font-medium text-[var(--text-primary)] tracking-tight">Analyse du document…</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">extraction des données</p>
                                </div>
                            )}
                            {scanStatus === 'done' && (
                                <div className="py-12">
                                    <CheckCircle2 size={36} className="mx-auto mb-4 text-emerald-600" strokeWidth={2.2} />
                                    <p className="text-[15px] font-medium text-[var(--text-primary)] tracking-tight">Analyse terminée</p>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                className="mt-6 text-[13px] text-orange-600 dark:text-orange-300 hover:underline tracking-tight"
                            >
                                Passer à la saisie manuelle
                            </button>
                        </div>
                    )}

                    {mode === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="field-label">Nom du logement</label>
                                <input
                                    type="text"
                                    className={fieldClass(errors.name)}
                                    placeholder="Ex : Gîte des Lilas"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                                {errors.name && <p className="field-error">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="field-label">Adresse complète</label>
                                <div className="relative">
                                    <MapPin
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                                        size={14}
                                        strokeWidth={2.2}
                                    />
                                    <input
                                        type="text"
                                        className={`${fieldClass(errors.address)} pl-9`}
                                        placeholder="12 Rue de la Paix, 75000 Paris"
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                {errors.address && <p className="field-error">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="field-label">Région</label>
                                    <input
                                        type="text"
                                        className={fieldClass(errors.region)}
                                        placeholder="Nouvelle-Aquitaine"
                                        value={formData.region || ''}
                                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                                    />
                                    {errors.region && <p className="field-error">{errors.region}</p>}
                                </div>
                                <div>
                                    <label className="field-label">Département</label>
                                    <input
                                        type="text"
                                        className={fieldClass(errors.dept)}
                                        placeholder="33"
                                        value={formData.dept || ''}
                                        onChange={e => setFormData({ ...formData, dept: e.target.value })}
                                    />
                                    {errors.dept && <p className="field-error">{errors.dept}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="field-label">Date de début</label>
                                    <input
                                        type="date"
                                        className={fieldClass(errors.date)}
                                        value={formData.date || ''}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                    {errors.date && <p className="field-error">{errors.date}</p>}
                                    {formData.date && !errors.date && (
                                        <p className="num text-[11px] font-medium text-orange-600 dark:text-orange-300 mt-1.5 text-right tracking-tight">
                                            {getWeekNumberLabel(formData.date)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="field-label">Capacité</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className={`${fieldClass(errors.people)} w-20 text-center`}
                                            value={formData.people || ''}
                                            onChange={e => setFormData({ ...formData, people: +e.target.value })}
                                        />
                                        <div className="seg flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, people: 5 })}
                                                data-active={formData.people === 5}
                                                className="!px-2.5 !py-1.5 num"
                                            >
                                                5
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, people: 10 })}
                                                data-active={formData.people === 10}
                                                className="!px-2.5 !py-1.5 num"
                                            >
                                                10
                                            </button>
                                        </div>
                                    </div>
                                    {errors.people && <p className="field-error">{errors.people}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="field-label">Nuits</label>
                                    <input
                                        type="number"
                                        className={fieldClass(errors.nights)}
                                        placeholder="5"
                                        value={formData.nights || ''}
                                        onChange={e => setFormData({ ...formData, nights: +e.target.value })}
                                    />
                                    {errors.nights && <p className="field-error">{errors.nights}</p>}
                                </div>
                                <div>
                                    <label className="field-label">Coût total (€)</label>
                                    <input
                                        type="number"
                                        className={fieldClass(errors.cost)}
                                        placeholder="0"
                                        value={formData.cost ?? ''}
                                        onChange={e => setFormData({ ...formData, cost: +e.target.value })}
                                    />
                                    {errors.cost && <p className="field-error">{errors.cost}</p>}
                                </div>
                                <div>
                                    <label className="field-label">Source</label>
                                    <select
                                        className="field-input"
                                        value={formData.channel || 'Direct'}
                                        onChange={e => setFormData({ ...formData, channel: e.target.value })}
                                    >
                                        <option value="Direct">Direct</option>
                                        <option value="Airbnb">Airbnb</option>
                                        <option value="Booking">Booking</option>
                                        <option value="Gîtes">Gîtes</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="field-label">Organisation</label>
                                <select
                                    className={fieldClass(errors.org)}
                                    value={formData.org || 'MSF'}
                                    onChange={e => setFormData({ ...formData, org: e.target.value })}
                                >
                                    <option value="MSF">MSF</option>
                                    <option value="UNICEF">UNICEF</option>
                                    <option value="WWF">WWF</option>
                                </select>
                                {errors.org && <p className="field-error">{errors.org}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="field-label">Nom du contact</label>
                                    <input
                                        type="text"
                                        className="field-input"
                                        placeholder="M. Martin"
                                        value={formData.ownerName || ''}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Téléphone</label>
                                    <input
                                        type="tel"
                                        className="field-input"
                                        placeholder="06 12 34 56 78"
                                        value={formData.owner || ''}
                                        onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                    />
                                </div>
                            </div>

                            {submitError && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 text-red-700 dark:text-red-300"
                                >
                                    <AlertCircle size={14} strokeWidth={2.2} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium tracking-tight">{submitError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="btn-secondary flex-1"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={14} className="animate-spin" strokeWidth={2.2} /> Enregistrement…</>
                                    ) : (
                                        <><Save size={14} strokeWidth={2.2} /> Enregistrer</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};
