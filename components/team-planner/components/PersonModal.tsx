import React from 'react';
import { X, MapPin, Mail, Phone, Calendar, Heart, TrendingDown, Star, PhoneCall, CheckCircle, Play } from 'lucide-react';
import { Person } from '../types';
import { Tag } from './Tag';

interface PersonModalProps {
  person: Person;
  onClose: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({ person, onClose }) => {
  if (!person) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] w-full max-w-3xl rounded-xl shadow-2xl border border-gray-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-start bg-[#252525]">
          <div className="flex gap-5 items-center">
            {/* Photo de profil large */}
            <div className="h-20 w-20 rounded-full border-4 border-[#333] shadow-xl overflow-hidden flex-shrink-0">
                <img 
                    src={person.photoUrl} 
                    alt={person.name} 
                    className="w-full h-full object-cover"
                />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{person.name}</h2>
              <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    <MapPin size={12} /> {person.origin}
                  </span>
                  <span className="text-gray-400">{person.age} ans</span>
              </div>
              <div className="flex flex-wrap mt-2.5">
                {person.tags.map((tag, i) => <Tag key={i} label={tag} />)}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-300 custom-scrollbar flex-1">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Bio & Video */}
              <div className="lg:col-span-2 space-y-6">
                 
                 {/* Bio Section */}
                 <div className="bg-[#252525] p-5 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Star size={100} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">À propos</h3>
                    <p className="text-gray-200 leading-relaxed text-sm">
                        {person.bio || "Aucune description disponible pour ce collaborateur."}
                    </p>
                 </div>

                 {/* Video Presentation Placeholder */}
                 <div className="bg-[#252525] p-5 rounded-xl border border-white/5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Vidéo de présentation</h3>
                    <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer border border-white/10">
                        {/* Blurred Background */}
                        <img 
                            src={person.photoUrl} 
                            alt="Video thumbnail" 
                            className="w-full h-full object-cover blur-md opacity-40 scale-110 group-hover:scale-100 transition-transform duration-700" 
                        />
                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all shadow-xl">
                                <Play size={24} className="text-white ml-1 fill-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium">
                            01:24
                        </div>
                    </div>
                 </div>

                 {/* Tracking History */}
                 <div className="bg-[#252525] rounded-xl border border-white/5 p-5">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <PhoneCall size={14} className="text-purple-400"/> Historique CRM
                    </h3>
                    {person.trackingHistory && person.trackingHistory.length > 0 ? (
                        <div className="space-y-4">
                            {person.trackingHistory.map((entry, idx) => (
                                <div key={idx} className="flex gap-4 items-start relative">
                                    {idx !== person.trackingHistory.length - 1 && (
                                        <div className="absolute left-[19px] top-8 bottom-[-16px] w-px bg-gray-700"></div>
                                    )}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#1e1e1e] z-10 
                                        ${entry.type === 'call' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                                        {entry.type === 'call' ? <PhoneCall size={16} /> : <Calendar size={16} />}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-white">{entry.date}</span>
                                            <span className="text-xs text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{entry.author}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">{entry.summary}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500 flex flex-col items-center">
                            <p className="text-sm">Aucun historique récent.</p>
                        </div>
                    )}
                 </div>

              </div>

              {/* Right Column: KPIs & Contact */}
              <div className="space-y-4">
                 
                 {/* Contact Card */}
                 <div className="bg-[#2a2a2a] p-4 rounded-xl border border-white/5 space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Mail size={18} />
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Email</div>
                            <div className="text-white font-medium text-sm truncate" title={person.email}>{person.email}</div>
                        </div>
                     </div>
                     <div className="h-px bg-white/5"></div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
                            <Phone size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-500 uppercase font-bold">Téléphone</div>
                            <div className="text-white font-medium text-sm">{person.phone}</div>
                        </div>
                     </div>
                 </div>

                 {/* KPIs Grid */}
                 <div className="grid grid-cols-1 gap-3">
                    <div className="bg-[#252525] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Qualité</div>
                            <div className="text-2xl font-bold text-white">{person.qualityScore}/100</div>
                        </div>
                        <div className="h-10 w-10 rounded-full border-4 border-green-500/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-green-400">A</span>
                        </div>
                    </div>
                    <div className="bg-[#252525] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Donateurs</div>
                            <div className="text-2xl font-bold text-white">{person.regularDonors}</div>
                        </div>
                        <Heart size={24} className="text-pink-500 opacity-50" />
                    </div>
                    <div className="bg-[#252525] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Attrition</div>
                            <div className="text-2xl font-bold text-white">{person.attritionRate}%</div>
                        </div>
                        <TrendingDown size={24} className={`${person.attritionRate < 5 ? 'text-green-500' : 'text-red-500'} opacity-50`} />
                    </div>
                 </div>

              </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 bg-[#252525] flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-transparent hover:bg-gray-700 text-gray-300 transition border border-gray-600 hover:border-gray-500 text-sm">Fermer</button>
            <button className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition shadow-lg shadow-blue-900/20 text-sm flex items-center gap-2">
                <Phone size={14} /> Contacter
            </button>
        </div>
      </div>
    </div>
  );
};