import React, { useState, useEffect } from 'react';
import { X, MapPin, Upload, Loader2, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import type { Housing } from './types';
import { getWeekNumberLabel } from './helpers';
import { housingsService } from '@/services/housingsService';
import { geocodeAddress } from '@/services/geocodingService';

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

    if (!isOpen) return null;

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        const validationErrors = validate(formData);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        const address = formData.address!.trim();

        // Map UI form to HousingRow DB columns
        const nights = Number(formData.nights);
        const startDate = formData.date!;
        const endDate = addDays(startDate, nights);
        const cost = Number(formData.cost) || 0;

        setIsSubmitting(true);
        try {
            // Geocode the address via the BAN API. Coordinates are required for
            // the smart matcher, so block submission if geocoding fails — surface
            // an inline error and let the user correct the address.
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
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création du logement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScanFile = () => {
        setScanStatus('scanning');
        setTimeout(() => {
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
            setTimeout(() => setMode('manual'), 800);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{mode === 'manual' ? 'Saisie Manuelle' : 'Scanner un document'}</h3>
                    <button onClick={onClose}><X className="text-[var(--text-muted)] hover:text-slate-600 dark:hover:text-slate-300" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {mode === 'scan' && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            {scanStatus === 'idle' && (
                                <div onClick={handleScanFile} className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                                    <Upload size={48} className="text-[var(--text-muted)] mb-4" />
                                    <p className="font-medium text-[var(--text-secondary)]">Cliquez pour uploader le reçu</p>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">PDF, JPG, PNG acceptés</p>
                                </div>
                            )}
                            {scanStatus === 'scanning' && (
                                <div className="py-12">
                                    <Loader2 size={48} className="text-purple-600 animate-spin mb-4 mx-auto" />
                                    <p className="font-bold text-[var(--text-primary)]">Analyse du document...</p>
                                    <p className="text-sm text-[var(--text-secondary)]">Extraction des données via IA</p>
                                </div>
                            )}
                            {scanStatus === 'done' && (
                                <div className="py-12 text-green-600">
                                    <CheckCircle2 size={48} className="mx-auto mb-4" />
                                    <p className="font-bold">Analyse terminée !</p>
                                </div>
                            )}
                            <button onClick={() => setMode('manual')} className="mt-6 text-orange-600 text-sm hover:underline font-medium">Passer à la saisie manuelle</button>
                        </div>
                    )}
                    {mode === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nom du Logement</label>
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.name ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="Ex: Gîte des Lilas"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        autoFocus
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Adresse complète</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                                    <input
                                        type="text"
                                        className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.address ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="Ex: 12 Rue de la Paix, 75000 Paris"
                                        value={formData.address || ''}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Région</label>
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.region ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="Nouvelle-Aquitaine"
                                        value={formData.region || ''}
                                        onChange={e => setFormData({ ...formData, region: e.target.value })}
                                    />
                                    {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Département</label>
                                    <input
                                        type="text"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.dept ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="33"
                                        value={formData.dept || ''}
                                        onChange={e => setFormData({ ...formData, dept: e.target.value })}
                                    />
                                    {errors.dept && <p className="text-xs text-red-500 mt-1">{errors.dept}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Date début location</label>
                                    <input
                                        type="date"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.date ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        value={formData.date || ''}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                                    {formData.date && !errors.date && (
                                        <p className="text-xs text-orange-600 font-bold mt-1 text-right">{getWeekNumberLabel(formData.date)}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Capacité (Pers.)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className={`w-16 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-center dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.people ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                            value={formData.people || ''}
                                            onChange={e => setFormData({ ...formData, people: +e.target.value })}
                                        />
                                        <button type="button" onClick={() => setFormData({ ...formData, people: 5 })} className={`px-3 py-2 rounded-lg text-xs font-bold border ${formData.people === 5 ? 'bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>5</button>
                                        <button type="button" onClick={() => setFormData({ ...formData, people: 10 })} className={`px-3 py-2 rounded-lg text-xs font-bold border ${formData.people === 10 ? 'bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-400' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>10</button>
                                    </div>
                                    {errors.people && <p className="text-xs text-red-500 mt-1">{errors.people}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nuits</label>
                                    <input
                                        type="number"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.nights ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="5"
                                        value={formData.nights || ''}
                                        onChange={e => setFormData({ ...formData, nights: +e.target.value })}
                                    />
                                    {errors.nights && <p className="text-xs text-red-500 mt-1">{errors.nights}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Coût Total (€)</label>
                                    <input
                                        type="number"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)] ${errors.cost ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                        placeholder="0"
                                        value={formData.cost ?? ''}
                                        onChange={e => setFormData({ ...formData, cost: +e.target.value })}
                                    />
                                    {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Source</label>
                                    <select
                                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium bg-white dark:bg-[var(--bg-card-solid)]"
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
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Organisation</label>
                                <select
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium bg-white dark:bg-[var(--bg-card-solid)] ${errors.org ? 'border-red-500' : 'border-[var(--border-subtle)]'}`}
                                    value={formData.org || 'MSF'}
                                    onChange={e => setFormData({ ...formData, org: e.target.value })}
                                >
                                    <option value="MSF">MSF</option>
                                    <option value="UNICEF">UNICEF</option>
                                    <option value="WWF">WWF</option>
                                </select>
                                {errors.org && <p className="text-xs text-red-500 mt-1">{errors.org}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nom Contact</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]"
                                        placeholder="M. Martin"
                                        value={formData.ownerName || ''}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]"
                                        placeholder="06..."
                                        value={formData.owner || ''}
                                        onChange={e => setFormData({ ...formData, owner: e.target.value })}
                                    />
                                </div>
                            </div>

                            {submitError && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium">{submitError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 text-[var(--text-secondary)] font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-orange-600 text-white font-bold text-sm rounded-lg shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
                                    ) : (
                                        <><Save size={16} /> Enregistrer</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
