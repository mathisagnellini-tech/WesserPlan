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
    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl z-[800] p-12 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-600">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between sticky top-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md z-10 py-8 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 dark:shadow-slate-900"><FileText size={32} strokeWidth={2.5} /></div>
              <div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Export CNFF</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: ASSOCIATIONS.find(a => a.id === selectedNGO)?.color || '#000' }}></div>
                  <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-[11px] tracking-[0.25em]">{selectedNGO} &bull; Format Officiel</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onCopy} className={`flex items-center gap-4 px-12 py-6 rounded-[1.5rem] text-[15px] font-black uppercase tracking-wider transition-all shadow-2xl active:scale-95 ${hasCopied ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-emerald-900' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300 dark:shadow-slate-900'}`}>
              {hasCopied ? <Check size={22} strokeWidth={2.5} /> : <Copy size={22} strokeWidth={2.5} />}
              {hasCopied ? 'Copié !' : 'Copier tout'}
            </button>
            <button onClick={onClose} className="p-6 bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-200 dark:hover:border-slate-700 rounded-[1.5rem] transition-all shadow-sm">
              <X size={28} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="grid gap-10 pb-20">
          {cnffData.length > 0 ? cnffData.map((w, idx) => (
            <div key={idx} className="bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 rounded-[3rem] p-12 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.04)] group hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-400">
              <div className="flex items-center gap-5 mb-10">
                <div className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">Semaine {w.week}</div>
                <div className="h-px flex-grow bg-slate-100 dark:bg-slate-700 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30 transition-colors"></div>
              </div>
              <div className="columns-1 sm:columns-2 md:columns-3 gap-10 space-y-4">
                {w.towns.map((town, tIdx) => (
                  <div key={tIdx} className="flex items-start gap-3">
                    <span className="text-slate-200 dark:text-slate-600 font-mono mt-0.5">–</span>
                    <span className="text-[14px] font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight selection:bg-orange-100 dark:selection:bg-orange-900/50">
                      {town}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 border-dashed rounded-[4rem] p-32 text-center shadow-inner">
              <FileText className="mx-auto mb-8 text-slate-100 dark:text-slate-700" size={80} strokeWidth={1.5} />
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Aucun déploiement planifié</p>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">Placez des zones dans le calendrier pour générer le rapport CNFF.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CnffReport;
