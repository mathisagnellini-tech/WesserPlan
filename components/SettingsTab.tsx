
import React, { useState } from 'react';
import { User, Palette, Bell, Database, Trash2, KeyRound, Sun, Moon } from 'lucide-react';

const SettingsCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
            <Icon className="text-[var(--highlight-text)]" />
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
    <label htmlFor={label} className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <div className="relative">
            <input id={label} type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
            <div className={`block w-10 h-6 rounded-full transition ${enabled ? 'bg-orange-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${enabled ? 'transform translate-x-full' : ''}`}></div>
        </div>
    </label>
);

const SettingsTab: React.FC<{ isDark: boolean; onSetTheme: (theme: 'light' | 'dark') => void }> = ({ isDark, onSetTheme }) => {
    const [notifications, setNotifications] = useState({ summary: true, alerts: true, news: false });

    return (
        <section className="animate-fade-in">
            <header className="mb-4 md:mb-8 mt-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Paramètres</h2>
                <p className="text-sm md:text-lg text-[var(--text-secondary)] mt-1 font-medium">Gérez votre profil, vos préférences et les données de l'application.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SettingsCard title="Profil Utilisateur" icon={User}>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-700 shadow-md">
                                GL
                            </div>
                            <div>
                                <button className="text-sm font-semibold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-500/30 transition">Changer d'avatar</button>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">PNG ou JPG, max 800Kb.</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nom complet</label>
                            <input type="text" defaultValue="Gérard Larcher" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition p-2.5" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Adresse e-mail</label>
                            <input type="email" defaultValue="gerard.larcher@example.com" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition p-2.5" />
                        </div>
                        <div className="flex justify-end">
                            <button className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition shadow-lg shadow-orange-500/20">Enregistrer</button>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Gestion des Données" icon={Database}>
                        <p className="text-sm text-[var(--text-secondary)]">Actions irréversibles. Videz les données sauvegardées dans votre navigateur pour une catégorie spécifique.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition"><Trash2 size={16} /> Vider les logements</button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition"><Trash2 size={16} /> Vider les véhicules</button>
                        </div>
                    </SettingsCard>
                </div>

                <div className="space-y-8">
                    <SettingsCard title="Préférences" icon={Palette}>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Thème de l'application</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onSetTheme('light')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${!isDark ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm' : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-slate-300'}`}
                                >
                                    <Sun size={18} /> Clair
                                </button>
                                <button
                                    onClick={() => onSetTheme('dark')}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all ${isDark ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm' : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-slate-300'}`}
                                >
                                    <Moon size={18} /> Sombre
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Langue</label>
                            <select className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition p-2.5">
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
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Clé API Wesser</label>
                            <input type="password" value="••••••••••••••••••••" readOnly className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition p-2.5" />
                        </div>
                     </SettingsCard>
                </div>
            </div>
        </section>
    );
};

export default SettingsTab;
