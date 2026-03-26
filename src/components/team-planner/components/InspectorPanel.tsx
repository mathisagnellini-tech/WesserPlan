import React, { useEffect, useState } from 'react';
import { X, MapPin, ShieldCheck } from 'lucide-react';
import { Person, Relationship } from '../types';
import { PersonInfo } from './inspector/PersonInfo';
import { RelationsList } from './inspector/RelationsList';
import { PlanningTab } from './inspector/PlanningTab';
import { SecurityTab } from './inspector/SecurityTab';
import { PrivateTab } from './inspector/PrivateTab';

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

  // Security State
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
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
      if (isUnlocked) {
          setSecureView(view);
      } else {
          setSecureView(view);
          setShowPinInput(true);
      }
  };

  const handlePinSubmit = () => {
      if (pin === '2003') {
          setIsUnlocked(true);
          setShowPinInput(false);
          setPin('');
      } else {
          alert('Code incorrect');
          setPin('');
      }
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
            fixed top-4 bottom-4 right-4 w-[440px] z-[110] rounded-[36px]
            bg-white dark:bg-slate-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40 dark:border-slate-700
            flex flex-col overflow-hidden
            transform transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[40px] opacity-0'}
        `}
      >
        {/* Hero Header */}
        <div className="relative h-72 flex-shrink-0 bg-slate-50 overflow-hidden group">
             <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                <img src={person.photoUrl} className="w-full h-full object-cover" alt={person.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-60" />
             </div>
             <button onClick={handleClose} className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all border border-white/20 z-20">
                <X size={20} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black/80 to-transparent">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-sm mb-3">
                    <MapPin size={12} className="text-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{person.origin}</span>
                </div>
                <h2 className="text-4xl font-black text-white leading-none tracking-tight mb-2 drop-shadow-lg">{person.name}</h2>
                <div className="text-lg text-white/80 font-medium">{person.role}</div>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 sticky top-0 overflow-x-auto no-scrollbar py-2">
            {['info', 'dates', 'docs', 'relations', 'private'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all capitalize whitespace-nowrap
                        ${activeTab === tab
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                            : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'}
                    `}
                >
                    {tab === 'info' ? 'Profil' : tab === 'dates' ? 'Planning' : tab === 'docs' ? 'Sécurité' : tab === 'relations' ? 'Relations' : 'Privé'}
                </button>
            ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar-light bg-slate-50/30">
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
            {activeTab === 'private' && <PrivateTab person={person} isUnlocked={isUnlocked} onRequestUnlock={() => setShowPinInput(true)} />}
        </div>
      </div>

      {/* Security PIN Modal */}
      {showPinInput && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/40 backdrop-blur-xl animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                      <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Code PIN</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium">Entrez "2003" pour accéder</p>
                  <input
                    autoFocus
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center text-4xl font-black tracking-[0.5em] text-slate-900 dark:text-white border-none focus:outline-none bg-transparent placeholder:text-slate-200 mb-8"
                    placeholder="••••"
                  />
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setShowPinInput(false)} className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Annuler</button>
                      <button onClick={handlePinSubmit} className="py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-black transition-colors shadow-lg shadow-slate-900/20">Valider</button>
                  </div>
              </div>
          </div>
      )}

      {/* Secure Content Viewer */}
      {isUnlocked && secureView !== 'none' && secureView !== 'notes' && !showPinInput && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-xl animate-in fade-in">
               <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                       <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 ml-2">Document Sécurisé</h3>
                       <button onClick={() => setSecureView('none')} className="p-2 bg-white dark:bg-[var(--bg-card-solid)] rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"><X size={20}/></button>
                   </div>
                   <div className="p-10 bg-slate-50 flex items-center justify-center flex-1 overflow-auto">
                        {secureView === 'score' ? (
                            <div className="w-full bg-white dark:bg-[var(--bg-card-solid)] p-8 rounded-[24px] shadow-sm text-center border border-slate-100 dark:border-slate-800">
                                <div className="text-7xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">A+</div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">Score Global</div>
                            </div>
                        ) : (
                             person.documents[secureView as keyof typeof person.documents] ? (
                                <img src={person.documents[secureView as keyof typeof person.documents]} className="max-w-full rounded-2xl shadow-lg border border-white" alt="Document" />
                             ) : (
                                <div className="text-slate-400 font-medium italic">Document non disponible</div>
                             )
                        )}
                   </div>
               </div>
           </div>
      )}
    </>
  );
};
