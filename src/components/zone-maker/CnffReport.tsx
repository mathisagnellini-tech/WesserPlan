import React from 'react';
import { FileText, Copy, Check, X } from 'lucide-react';
import { ASSOCIATIONS } from '@/hooks/useZonePlanner';

interface CnffReportProps {
  selectedNGO: string;
  cnffData: { week: number; towns: string[] }[];
  hasCopied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

const CnffReport: React.FC<CnffReportProps> = ({ selectedNGO, cnffData, hasCopied, onCopy, onClose }) => {
  return (
    <div className="app-surface absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl z-[800] p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between sticky top-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md z-10 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg">
              <FileText size={24} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="display text-slate-900 dark:text-white text-[32px] tracking-tight leading-none">Export CNFF</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full" style={{ background: ASSOCIATIONS.find(a => a.id === selectedNGO)?.color || '#000' }} />
                <p className="eyebrow leading-none">{selectedNGO} · format officiel</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCopy}
              className={`btn-primary !px-5 !py-3 ${hasCopied ? '!bg-emerald-600 hover:!bg-emerald-700' : ''}`}
            >
              {hasCopied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={2.2} />}
              {hasCopied ? 'Copié' : 'Copier tout'}
            </button>
            <button onClick={onClose} aria-label="Fermer" className="btn-secondary !p-3">
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 pb-12">
          {cnffData.length > 0 ? cnffData.map((w, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-2xl p-7 shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] group hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="num eyebrow leading-none px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                  Semaine {w.week}
                </div>
                <div className="h-px flex-grow bg-[var(--border-subtle)] group-hover:bg-orange-100 dark:group-hover:bg-orange-500/25 transition-colors" />
              </div>
              <div className="columns-1 sm:columns-2 md:columns-3 gap-8 space-y-2">
                {w.towns.map((town, tIdx) => (
                  <div key={tIdx} className="flex items-start gap-2">
                    <span className="text-slate-300 dark:text-slate-600 font-mono mt-0.5">–</span>
                    <span className="text-[13px] font-mono font-medium text-slate-700 dark:text-slate-300 tracking-tight selection:bg-orange-100 dark:selection:bg-orange-500/25">
                      {town}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-dashed border-[var(--border-subtle)] rounded-3xl p-20 text-center">
              <FileText className="mx-auto mb-5 text-slate-200 dark:text-slate-700" size={48} strokeWidth={1.8} />
              <p className="display text-slate-900 dark:text-white text-2xl tracking-tight mb-2">Aucun déploiement planifié</p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed tracking-tight">
                Placez des zones dans le calendrier pour générer le rapport CNFF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CnffReport;
