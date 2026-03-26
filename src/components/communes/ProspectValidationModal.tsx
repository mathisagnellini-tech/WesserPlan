import React from 'react';
import { createPortal } from 'react-dom';
import { Send, AlertTriangle, X, List as ListIcon } from 'lucide-react';
import { MapCommuneFeature } from '@/components/communes/types';

export const ProspectValidationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    communes: MapCommuneFeature[];
    stats: { count: number; pop: number; zones: string };
}> = ({ isOpen, onClose, onConfirm, communes, stats }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
             <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in overflow-hidden">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                            <Send className="text-orange-600" size={24}/>
                            Validation de la Prospection
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">Récapitulatif de votre demande de zone</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                            <span className="block text-2xl font-black text-orange-700">{stats.count}</span>
                            <span className="text-xs font-bold text-orange-400 uppercase">Communes</span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                            <span className="block text-2xl font-black text-emerald-700">{(stats.pop / 1000).toFixed(1)}k</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase">Habitants</span>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 text-center">
                            <span className="block text-2xl font-black text-purple-700 dark:text-purple-400">{stats.zones}</span>
                            <span className="text-xs font-bold text-purple-400 uppercase">Zones Estimées</span>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20}/>
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase mb-1">Confirmation d'envoi automatique</h4>
                            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                En cliquant sur valider, <span className="font-bold underline">dans 15 min un mail s'enverra automatiquement</span> à toutes les mairies sélectionnées ci-dessous pour initier la prise de contact.
                            </p>
                        </div>
                    </div>

                    {/* Commune List */}
                    <div>
                        <h4 className="font-bold text-[var(--text-primary)] mb-2 text-sm flex items-center gap-2">
                            <ListIcon size={16}/> Liste des communes ciblées
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border-subtle)] max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {communes.map((c) => (
                                <div key={c.properties.code} className="bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-lg border border-[var(--border-subtle)] shadow-sm flex justify-between items-center text-xs">
                                    <span className="font-bold text-[var(--text-primary)]">{c.properties.nom}</span>
                                    <span className="text-[var(--text-muted)]">{c.properties.population.toLocaleString()} hab.</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 dark:shadow-orange-900/50 transition-all flex items-center gap-2">
                        <Send size={16}/> Confirmer & Envoyer
                    </button>
                </div>
             </div>
        </div>,
        document.body
    );
};
