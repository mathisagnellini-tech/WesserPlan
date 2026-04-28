import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ClusteringResult } from './types';
import { MIN_1W, MAX_1W, MIN_2W, MAX_2W, MIN_3W, MAX_3W } from './constants';
import { Info, X, Clock, Users, AlertCircle, BarChart3, Target } from 'lucide-react';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface SectorPolicyModalProps {
  selectedNGO: string;
  data: ClusteringResult;
  onClose: () => void;
}

const SectorPolicyModal: React.FC<SectorPolicyModalProps> = ({ selectedNGO, data, onClose }) => {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { dialogRef } = useDialogA11y({ isOpen: true, onClose, initialFocusRef: closeRef });
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div ref={dialogRef} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] shadow-xl"><Info size={28} strokeWidth={2.5} /></div>
            <div>
              <h3 id={titleId} className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Information Plan</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">{selectedNGO} &bull; R&eacute;glementation &amp; Chiffres</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="p-4 bg-white dark:bg-[var(--bg-card-solid)] hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] transition-all"><X size={24} /></button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
          {/* STATISTIQUES ACTUELLES */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><BarChart3 size={16} /> État actuel du déploiement</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 space-y-2">
                <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Target size={14} /> Zones créées</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{data.clusters.length}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 space-y-2">
                <div className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Users size={14} /> Population totale</div>
                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {(data.clusters.reduce((sum, c) => sum + c.totalPopulation, 0) / 1000).toFixed(1)}k
                </div>
              </div>
            </div>
          </div>

          {/* RÈGLES DE DIMENSIONNEMENT */}
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] px-1 flex items-center gap-3"><Clock size={16} /> Règles de dimensionnement</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-6 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black text-sm">1S</div>
                  <span className="text-emerald-900 dark:text-emerald-200 font-black text-sm">Semaine (Standard)</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold text-xs">{MIN_1W.toLocaleString()} - {MAX_1W.toLocaleString()} hab.</span>
              </div>
              <div className="flex items-center justify-between p-6 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center font-black text-sm">2S</div>
                  <span className="text-orange-900 dark:text-orange-200 font-black text-sm">Semaine (Double)</span>
                </div>
                <span className="text-orange-700 dark:text-orange-300 font-bold text-xs">{MIN_2W.toLocaleString()} - {MAX_2W.toLocaleString()} hab.</span>
              </div>
              <div className="flex items-center justify-between p-6 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black text-sm">3S</div>
                  <span className="text-purple-900 dark:text-purple-200 font-black text-sm">Semaine (Triple)</span>
                </div>
                <span className="text-purple-700 dark:text-purple-300 font-bold text-xs">{MIN_3W.toLocaleString()} - {MAX_3W.toLocaleString()} hab.</span>
              </div>
            </div>
            <div className="p-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-[1.5rem] flex gap-4">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                Une zone sous les <span className="font-black">{MIN_1W.toLocaleString()} habitants</span> est considérée comme "Insuffisante". Utilisez le mode <span className="font-black text-orange-600">ZONE BONUS</span> pour absorbé des communes orphelines sans impacter la durée de votre planning.
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button type="button" onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 dark:shadow-slate-900">Compris</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SectorPolicyModal;
