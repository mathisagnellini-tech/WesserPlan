import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Person, Relationship } from '../types';
import { PersonInfo } from './inspector/PersonInfo';
import { RelationsList } from './inspector/RelationsList';
import { PlanningTab } from './inspector/PlanningTab';
import { SecurityTab } from './inspector/SecurityTab';
import { PrivateTab } from './inspector/PrivateTab';
import { useAuthStore } from '@/stores/authStore';

interface InspectorPanelProps {
  person: Person;
  allPeople: Record<string, Person>;
  relationships: Relationship[];
  onClose: () => void;
  onAddRelationship: (targetId: string, type: 'affinity' | 'conflict' | 'synergy') => void;
  onRemoveRelationship: (relId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ person, allPeople, relationships, onClose, onAddRelationship, onRemoveRelationship }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'dates' | 'docs' | 'relations' | 'private'>('info');

  // Security: gated on Azure AD authentication. The whole app is wrapped in
  // AuthProvider so by the time the user reaches this panel they are signed in.
  // The previous hardcoded PIN ('2003') was removed — it added no real security
  // and was visible in the source.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isUnlocked = isAuthenticated;
  const [secureView, setSecureView] = useState<'none' | 'cni' | 'license' | 'badge' | 'score' | 'notes'>('none');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350);
  };

  const handleSecureAccess = (view: 'cni' | 'license' | 'badge' | 'score') => {
      if (!isUnlocked) return;
      setSecureView(view);
  };

  if (!person) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[4px] z-[100] transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Main Panel */}
      <div
        className={`
            app-surface fixed top-4 bottom-4 right-4 w-[440px] z-[110] rounded-[28px]
            bg-white dark:bg-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[var(--border-subtle)]
            flex flex-col overflow-hidden
            transform transition-all duration-500
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[40px] opacity-0'}
        `}
      >
        {/* Hero Header */}
        <div className="relative h-72 flex-shrink-0 bg-slate-50 dark:bg-slate-800 overflow-hidden group">
             <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
             </div>
             <button
                onClick={handleClose}
                aria-label="Fermer"
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition active:translate-y-[1px] border border-white/20 z-20"
             >
                <X size={16} strokeWidth={2.2} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-7 pt-20 bg-gradient-to-t from-black/80 to-transparent">
                <div className="num inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-md border border-white/15 mb-3 tracking-tight">
                    <MapPin size={11} className="text-white" strokeWidth={2.4} />
                    <span className="text-[11px] font-medium text-white">{person.origin}</span>
                </div>
                <h2 className="display text-white text-[36px] leading-none tracking-tight mb-2 drop-shadow-lg">{person.name}</h2>
                <div className="text-[15px] text-white/80 tracking-tight">{person.role}</div>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-white dark:bg-slate-900 z-10 sticky top-0 overflow-x-auto no-scrollbar">
            <div className="seg w-fit">
                {['info', 'dates', 'docs', 'relations', 'private'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        data-active={activeTab === tab}
                    >
                        {tab === 'info' ? 'Profil' : tab === 'dates' ? 'Planning' : tab === 'docs' ? 'Sécurité' : tab === 'relations' ? 'Relations' : 'Privé'}
                    </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar-light bg-slate-50/30 dark:bg-slate-900/30">
            {activeTab === 'info' && <PersonInfo person={person} />}
            {activeTab === 'relations' && (
                <RelationsList
                    person={person}
                    allPeople={allPeople}
                    relationships={relationships}
                    onAddRelationship={onAddRelationship}
                    onRemoveRelationship={onRemoveRelationship}
                />
            )}
            {activeTab === 'dates' && <PlanningTab person={person} />}
            {activeTab === 'docs' && <SecurityTab isUnlocked={isUnlocked} onSecureAccess={handleSecureAccess} />}
            {activeTab === 'private' && <PrivateTab person={person} isUnlocked={isUnlocked} onRequestUnlock={() => { /* unreachable: gated by auth */ }} />}
        </div>
      </div>

      {/* Secure Content Viewer */}
      {isUnlocked && secureView !== 'none' && secureView !== 'notes' && (
           <div className="app-surface fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/45 backdrop-blur-xl animate-in fade-in">
               <div className="modal-shell max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95">
                   <div className="modal-accent-strip p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                       <h3 className="display text-slate-900 dark:text-white text-lg leading-none ml-2">Document sécurisé</h3>
                       <button
                           onClick={() => setSecureView('none')}
                           aria-label="Fermer"
                           className="btn-ghost !p-2"
                       >
                           <X size={16} strokeWidth={2.2} />
                       </button>
                   </div>
                   <div className="p-10 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-center flex-1 overflow-auto">
                        {secureView === 'score' ? (
                            <div className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-8 rounded-2xl shadow-sm text-center border border-[var(--border-subtle)]">
                                <div className="num display text-slate-900 dark:text-white text-[80px] leading-none tracking-tight mb-2">A+</div>
                                <div className="eyebrow leading-none">Score global</div>
                            </div>
                        ) : (
                             person.documents[secureView as keyof typeof person.documents] ? (
                                <img src={person.documents[secureView as keyof typeof person.documents]} className="max-w-full rounded-2xl shadow-lg border border-white" alt="Document" />
                             ) : (
                                <div className="text-[13px] text-slate-400 dark:text-slate-500 italic tracking-tight">Document non disponible</div>
                             )
                        )}
                   </div>
               </div>
           </div>
      )}
    </>
  );
};
