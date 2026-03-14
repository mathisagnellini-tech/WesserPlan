
import React, { useState } from 'react';
import { User, Palette, Bell, Database, Trash2, KeyRound } from 'lucide-react';

const SettingsCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-3">
            <Icon className="text-highlight-text" />
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
    <label htmlFor={label} className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-text-secondary">{label}</span>
        <div className="relative">
            <input id={label} type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
            <div className={`block w-10 h-6 rounded-full transition ${enabled ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${enabled ? 'transform translate-x-full' : ''}`}></div>
        </div>
    </label>
);

const SettingsTab: React.FC = () => {
    const [theme, setTheme] = useState('light');
    const [notifications, setNotifications] = useState({ summary: true, alerts: true, news: false });

    return (
        <section className="animate-fade-in">
            <header className="mb-8 mt-2">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Paramètres</h2>
                <p className="text-lg text-slate-500 mt-1 font-medium">Gérez votre profil, vos préférences et les données de l'application.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SettingsCard title="Profil Utilisateur" icon={User}>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600 border-2 border-white shadow-md">
                                GL
                            </div>
                            <div>
                                <button className="text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition">Changer d'avatar</button>
                                <p className="text-xs text-text-secondary mt-1">PNG ou JPG, max 800Kb.</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Nom complet</label>
                            <input type="text" defaultValue="Gérard Larcher" className="w-full bg-white/60 border border-gray-200/80 text-text-primary placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-text/50 transition p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Adresse e-mail</label>
                            <input type="email" defaultValue="gerard.larcher@example.com" className="w-full bg-white/60 border border-gray-200/80 text-text-primary placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-text/50 transition p-2" />
                        </div>
                        <div className="flex justify-end">
                            <button className="px-5 py-2 text-sm font-semibold text-white bg-highlight-text rounded-lg hover:bg-opacity-90 transition shadow">Enregistrer</button>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Gestion des Données" icon={Database}>
                        <p className="text-sm text-text-secondary">Actions irréversibles. Videz les données sauvegardées dans votre navigateur pour une catégorie spécifique.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"><Trash2 size={16} /> Vider les logements</button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"><Trash2 size={16} /> Vider les véhicules</button>
                        </div>
                    </SettingsCard>
                </div>

                <div className="space-y-8">
                    <SettingsCard title="Préférences" icon={Palette}>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Thème de l'application</label>
                            <div className="flex gap-2">
                                <button onClick={() => setTheme('light')} className={`flex-1 p-3 rounded-lg border-2 ${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>Clair</button>
                                <button onClick={() => setTheme('dark')} className={`flex-1 p-3 rounded-lg border-2 ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>Sombre</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Langue</label>
                            <select className="w-full bg-white/60 border border-gray-200/80 text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-text/50 transition p-2">
                                <option>Français</option>
                                <option>English</option>
                            </select>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Notifications" icon={Bell}>
                        <Toggle label="Résumé hebdomadaire par e-mail" enabled={notifications.summary} setEnabled={val => setNotifications(s => ({ ...s, summary: val }))} />
                        <Toggle label="Alertes critiques (ex: échec d'import)" enabled={notifications.alerts} setEnabled={val => setNotifications(s => ({ ...s, alerts: val }))} />
                        <Toggle label="Nouveautés et mises à jour" enabled={notifications.news} setEnabled={val => setNotifications(s => ({ ...s, news: val }))} />
                    </SettingsCard>
                     <SettingsCard title="API & Intégrations" icon={KeyRound}>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Clé API Wesser</label>
                            <input type="password" value="••••••••••••••••••••" readOnly className="w-full bg-white/60 border border-gray-200/80 text-text-primary placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-highlight-text/50 transition p-2" />
                        </div>
                     </SettingsCard>
                </div>
            </div>
        </section>
    );
};

export default SettingsTab;
