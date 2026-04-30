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

  const totalPop = data.clusters.reduce((sum, c) => sum + c.totalPopulation, 0);

  // Tier color tokens are intentional — emerald/orange/violet map to 1S/2S/3S
  // duration tiers and read as a deliberate scale. Kept desaturated.
  const tiers = [
    {
      key: '1S',
      label: 'Semaine standard',
      tone: 'bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/25',
      badge: 'bg-emerald-600',
      range: `${MIN_1W.toLocaleString('fr-FR')} – ${MAX_1W.toLocaleString('fr-FR')} hab.`,
    },
    {
      key: '2S',
      label: 'Semaine double',
      tone: 'bg-orange-50 text-orange-800 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-200 dark:ring-orange-500/25',
      badge: 'bg-orange-600',
      range: `${MIN_2W.toLocaleString('fr-FR')} – ${MAX_2W.toLocaleString('fr-FR')} hab.`,
    },
    {
      key: '3S',
      label: 'Semaine triple',
      tone: 'bg-violet-50 text-violet-800 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25',
      badge: 'bg-violet-600',
      range: `${MIN_3W.toLocaleString('fr-FR')} – ${MAX_3W.toLocaleString('fr-FR')} hab.`,
    },
  ];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-surface fixed inset-0 bg-slate-950/55 backdrop-blur-sm z-[1100] flex items-center justify-center p-6 animate-in fade-in duration-300"
    >
      <div ref={dialogRef} className="modal-shell w-full max-w-2xl flex flex-col animate-in zoom-in duration-300">
        <div className="modal-accent-strip p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
              <Info size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h3 id={titleId} className="display text-slate-900 dark:text-white text-2xl tracking-tight leading-tight">
                Information du plan
              </h3>
              <p className="eyebrow leading-none mt-1">{selectedNGO} · règles &amp; chiffres</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2">
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="p-7 space-y-7 overflow-y-auto max-h-[70vh]">
          {/* Stats actuelles */}
          <div className="space-y-4">
            <h4 className="eyebrow leading-none flex items-center gap-1.5 px-1">
              <BarChart3 size={11} strokeWidth={2.4} className="text-slate-400" /> État actuel du déploiement
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-card !p-5 relative">
                <div className="relative z-10">
                  <div className="eyebrow leading-none flex items-center gap-1.5">
                    <Target size={11} strokeWidth={2.4} /> Zones créées
                  </div>
                  <div className="num display text-slate-900 dark:text-white text-[32px] tracking-tight leading-none mt-2">
                    {data.clusters.length}
                  </div>
                </div>
              </div>
              <div className="kpi-card !p-5 relative">
                <div className="relative z-10">
                  <div className="eyebrow leading-none flex items-center gap-1.5">
                    <Users size={11} strokeWidth={2.4} /> Population totale
                  </div>
                  <div className="num display text-slate-900 dark:text-white text-[32px] tracking-tight leading-none mt-2">
                    {(totalPop / 1000).toFixed(1)}<span className="text-[20px] font-medium ml-0.5">k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Règles de dimensionnement */}
          <div className="space-y-4">
            <h4 className="eyebrow leading-none flex items-center gap-1.5 px-1">
              <Clock size={11} strokeWidth={2.4} className="text-slate-400" /> Règles de dimensionnement
            </h4>
            <div className="space-y-2">
              {tiers.map(tier => (
                <div
                  key={tier.key}
                  className={`flex items-center justify-between p-4 ring-1 rounded-xl ${tier.tone}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`num w-9 h-9 ${tier.badge} text-white rounded-lg flex items-center justify-center text-[12px] font-medium tracking-tight`}>
                      {tier.key}
                    </div>
                    <span className="text-[13px] font-medium tracking-tight">{tier.label}</span>
                  </div>
                  <span className="num text-[12px] font-medium tracking-tight">{tier.range}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/25 rounded-xl flex gap-3 items-start">
              <AlertCircle className="text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" size={16} strokeWidth={2.2} />
              <p className="text-[12px] text-amber-800 dark:text-amber-200 leading-relaxed tracking-tight">
                Une zone sous les <span className="num font-medium">{MIN_1W.toLocaleString('fr-FR')} habitants</span> est considérée comme « insuffisante ». Utilisez le mode{' '}
                <span className="font-medium text-orange-700 dark:text-orange-300">Zone bonus</span> pour absorber des communes orphelines sans impacter la durée du planning.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--border-subtle)] bg-slate-50/60 dark:bg-slate-800/40">
          <button type="button" onClick={onClose} className="btn-primary w-full">Compris</button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SectorPolicyModal;
