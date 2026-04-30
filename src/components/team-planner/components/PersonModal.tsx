import React from 'react';
import { X, MapPin, Mail, Phone, Calendar, Heart, TrendingDown, PhoneCall, Play } from 'lucide-react';
import { Person } from '../types';
import { Tag } from './Tag';

interface PersonModalProps {
  person: Person;
  onClose: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({ person, onClose }) => {
  if (!person) return null;

  return (
    <div className="app-surface fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="modal-shell w-full max-w-3xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="modal-accent-strip p-6 border-b border-[var(--border-subtle)] flex justify-between items-start">
          <div className="flex gap-5 items-center min-w-0">
            <div className="h-20 w-20 rounded-2xl shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-white dark:ring-slate-700">
                <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
            </div>

            <div className="min-w-0">
              <h2 className="display text-[28px] text-slate-900 dark:text-white leading-tight tracking-tight mb-1">{person.name}</h2>
              <div className="flex items-center gap-2 text-[13px] tracking-tight">
                  <span className="num inline-flex items-center gap-1 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-500/15 px-2 py-0.5 rounded-md ring-1 ring-orange-100 dark:ring-orange-500/25">
                    <MapPin size={11} strokeWidth={2.4} /> {person.origin}
                  </span>
                  <span className="num text-slate-500 dark:text-slate-400">{person.age} ans</span>
              </div>
              <div className="flex flex-wrap mt-2.5">
                {person.tags.map((tag, i) => <Tag key={i} label={tag} />)}
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="btn-ghost !p-2">
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 custom-scrollbar-light flex-1">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left */}
              <div className="lg:col-span-2 space-y-5">

                 {/* Bio */}
                 <div className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)]">
                    <h3 className="eyebrow leading-none mb-3">À propos</h3>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[13px] tracking-tight">
                        {person.bio || 'Aucune description disponible pour ce collaborateur.'}
                    </p>
                 </div>

                 {/* Video */}
                 <div className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)]">
                    <h3 className="eyebrow leading-none mb-3">Vidéo de présentation</h3>
                    <div className="w-full h-48 bg-slate-900 rounded-xl overflow-hidden relative group cursor-pointer">
                        <img
                            src={person.photoUrl}
                            alt="Aperçu vidéo"
                            className="w-full h-full object-cover blur-md opacity-40 scale-110 group-hover:scale-100 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-orange-600 group-hover:border-orange-400 transition-all shadow-xl">
                                <Play size={20} className="text-white ml-0.5 fill-white" />
                            </div>
                        </div>
                        <div className="num absolute bottom-3 left-3 px-2 py-0.5 bg-black/55 rounded text-[10px] text-white font-medium tracking-tight">
                            01:24
                        </div>
                    </div>
                 </div>

                 {/* CRM history */}
                 <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] p-5">
                    <h3 className="eyebrow leading-none mb-4 flex items-center gap-1.5">
                         <PhoneCall size={11} strokeWidth={2.4} className="text-orange-500" /> Historique CRM
                    </h3>
                    {person.trackingHistory && person.trackingHistory.length > 0 ? (
                        <div className="space-y-4">
                            {person.trackingHistory.map((entry, idx) => (
                                <div key={idx} className="flex gap-3 items-start relative">
                                    {idx !== person.trackingHistory.length - 1 && (
                                        <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-slate-100 dark:bg-slate-700" />
                                    )}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-1 z-10 ${
                                        entry.type === 'call'
                                            ? 'bg-orange-50 text-orange-600 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25'
                                            : 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/40'
                                    }`}>
                                        {entry.type === 'call' ? <PhoneCall size={13} strokeWidth={2.2} /> : <Calendar size={13} strokeWidth={2.2} />}
                                    </div>
                                    <div className="flex-1 pt-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5 gap-2">
                                            <span className="num text-[12px] font-medium text-slate-900 dark:text-white tracking-tight">{entry.date}</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded tracking-tight">
                                                {entry.author}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-relaxed tracking-tight">
                                            {entry.summary}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[12px] text-slate-400 dark:text-slate-500 italic text-center tracking-tight py-2">
                            Aucun historique récent.
                        </p>
                    )}
                 </div>

              </div>

              {/* Right column */}
              <div className="space-y-3">

                 {/* Contact */}
                 <div className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-[0_1px_0_rgba(15,23,42,0.02),0_8px_24px_-16px_rgba(15,23,42,0.06)] space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg ring-1 ring-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/25">
                            <Mail size={15} strokeWidth={2.2} />
                        </div>
                        <div className="overflow-hidden">
                            <div className="eyebrow leading-none">Email</div>
                            <div className="text-slate-900 dark:text-white text-[13px] font-medium truncate tracking-tight mt-0.5" title={person.email}>
                                {person.email}
                            </div>
                        </div>
                     </div>
                     <div className="h-px bg-[var(--border-subtle)]" />
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25">
                            <Phone size={15} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div className="eyebrow leading-none">Téléphone</div>
                            <div className="num text-slate-900 dark:text-white text-[13px] font-medium tracking-tight mt-0.5">
                                {person.phone}
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* KPIs */}
                 <div className="grid grid-cols-1 gap-3">
                    <div className="kpi-card !p-4 relative">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="eyebrow leading-none">Qualité</div>
                                <div className="num display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight mt-1.5">
                                    {person.qualityScore}<span className="text-slate-400 text-[16px] font-medium">/100</span>
                                </div>
                            </div>
                            <div className="h-9 w-9 rounded-full ring-2 ring-emerald-200 dark:ring-emerald-500/30 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 num text-[12px] font-semibold tracking-tight">
                                A
                            </div>
                        </div>
                    </div>
                    <div className="kpi-card !p-4 relative">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="eyebrow leading-none">Donateurs</div>
                                <div className="num display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight mt-1.5">
                                    {person.regularDonors}
                                </div>
                            </div>
                            <Heart size={20} strokeWidth={2.2} className="text-rose-400 dark:text-rose-300" />
                        </div>
                    </div>
                    <div className="kpi-card !p-4 relative">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <div className="eyebrow leading-none">Attrition</div>
                                <div className="num display text-slate-900 dark:text-white text-[28px] leading-none tracking-tight mt-1.5">
                                    {person.attritionRate}<span className="text-slate-400 text-[16px] font-medium">%</span>
                                </div>
                            </div>
                            <TrendingDown
                                size={20}
                                strokeWidth={2.2}
                                className={person.attritionRate < 5 ? 'text-emerald-500' : 'text-red-500'}
                            />
                        </div>
                    </div>
                 </div>

              </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-slate-50/60 dark:bg-slate-800/40 flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary">Fermer</button>
            <button className="btn-primary num">
                <Phone size={14} strokeWidth={2.2} /> Contacter
            </button>
        </div>
      </div>
    </div>
  );
};
