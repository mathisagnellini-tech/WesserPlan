import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Palette,
  Bell,
  Database,
  Trash2,
  Sun,
  Moon,
  LogOut,
  Info,
  Check,
  Clock,
  Upload,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { reporter } from '@/lib/observability';

const SettingsCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="glass-card p-6">
        <h3 className="display text-[var(--text-primary)] text-lg leading-tight tracking-tight mb-4 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
                <Icon size={15} strokeWidth={2.2} />
            </div>
            {title}
        </h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const slugify = (s: string) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

const Toggle: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => {
    const id = `toggle-${slugify(label)}`;
    return (
        <label htmlFor={id} className="flex items-center justify-between cursor-pointer group">
            <span className="text-[13px] text-[var(--text-secondary)] tracking-tight">{label}</span>
            <div className="relative">
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    aria-checked={enabled}
                    className="peer sr-only"
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                />
                <div className={`block w-10 h-6 rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-orange-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-page)] ${enabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${enabled ? 'transform translate-x-full' : ''}`}></div>
            </div>
        </label>
    );
};

const Toast: React.FC<{ message: string }> = ({ message }) => (
    <div
        role="status"
        aria-live="polite"
        className="app-surface fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in"
    >
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-slate-700">
            <Check size={15} strokeWidth={2.4} className="text-orange-400" />
            <span className="text-[13px] font-medium tracking-tight">{message}</span>
        </div>
    </div>
);

/**
 * Clear locally cached app state. Theme and preferences (the two intentionally
 * persisted client-side stores) are wiped along with anything else under the
 * `wesserplan-*` namespace. Server-backed data (Supabase / API) is untouched.
 */
const clearLocalCache = (): number => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('wesserplan-')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    return keysToRemove.length;
};

const PROFILE_SYNC_HINT =
    "Votre profil est synchronisé depuis Microsoft 365. Pour modifier votre nom ou votre adresse e-mail, rendez-vous dans votre compte Microsoft.";

const SettingsTab: React.FC = () => {
    const navigate = useNavigate();
    const { isDark, setTheme } = useThemeStore();
    const { userName, userEmail, logout, isAuthenticated } = useAuth();

    const notifications = usePreferencesStore((s) => s.notifications);
    const setNotification = usePreferencesStore((s) => s.setNotification);
    const language = usePreferencesStore((s) => s.language);
    const setLanguage = usePreferencesStore((s) => s.setLanguage);

    const [toast, setToast] = useState<string | null>(null);
    const [confirmClearOpen, setConfirmClearOpen] = useState(false);

    const nameId = useId();
    const emailId = useId();
    const profileHintId = useId();

    const showToast = (message: string) => {
        setToast(message);
        window.setTimeout(() => setToast(null), 3000);
    };

    const initials = userName
      ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';

    const handleClearCache = () => {
        let removed = 0;
        try {
            removed = clearLocalCache();
        } catch (err) {
            reporter.error('Échec du vidage du cache local', err, { source: 'SettingsTab.handleClearCache' });
            showToast('Impossible de vider le cache local. Réessayez ou contactez le support.');
            return;
        }
        showToast(
            removed > 0
                ? `Cache local vidé (${removed} clé${removed > 1 ? 's' : ''} supprimée${removed > 1 ? 's' : ''}). Rechargement…`
                : 'Aucune donnée locale à supprimer. Rechargement…',
        );
        // Reload after a short delay so the toast is visible and React state
        // (theme class, etc.) is reset cleanly from a fresh load.
        window.setTimeout(() => window.location.reload(), 800);
    };

    return (
        <section className="app-surface animate-fade-in">
            <header className="mb-5 md:mb-7 mt-2">
                <h2 className="display text-[var(--text-primary)] text-[34px] md:text-[40px] leading-none tracking-tight">Paramètres</h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-2 tracking-tight">
                    Gérez votre profil, vos préférences et les données de l'application.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <SettingsCard title="Profil utilisateur" icon={User}>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-300 border-2 border-white dark:border-slate-700 shadow-md"
                                aria-hidden="true"
                            >
                                {initials}
                            </div>
                            <div>
                                <Tooltip comingSoon content="Le changement d'avatar sera disponible prochainement.">
                                    <button
                                        type="button"
                                        aria-disabled="true"
                                        onClick={(e) => e.preventDefault()}
                                        className="btn-secondary !text-[12px] !cursor-not-allowed opacity-60"
                                    >
                                        Changer d'avatar
                                    </button>
                                </Tooltip>
                                <p className="eyebrow leading-none mt-2">bientôt disponible</p>
                            </div>
                        </div>

                        <div
                            id={profileHintId}
                            className="flex items-start gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/25 text-[12px] text-sky-900 dark:text-sky-200 tracking-tight leading-relaxed"
                        >
                            <Info size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{PROFILE_SYNC_HINT}</span>
                        </div>

                        <div>
                            <label htmlFor={nameId} className="field-label">Nom complet</label>
                            <input
                                id={nameId}
                                type="text"
                                value={userName ?? ''}
                                readOnly
                                aria-readonly="true"
                                aria-describedby={profileHintId}
                                className="field-input cursor-not-allowed opacity-80"
                            />
                        </div>
                        <div>
                            <label htmlFor={emailId} className="field-label">Adresse e-mail</label>
                            <input
                                id={emailId}
                                type="email"
                                value={userEmail ?? ''}
                                readOnly
                                aria-readonly="true"
                                aria-describedby={profileHintId}
                                className="field-input cursor-not-allowed opacity-80"
                            />
                        </div>
                        {isAuthenticated && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="btn-secondary !text-[12px] !text-red-600 dark:!text-red-300 !bg-red-50 dark:!bg-red-500/10 !border-red-100 dark:!border-red-500/25 hover:!border-red-200 dark:hover:!border-red-500/40"
                                >
                                    <LogOut size={14} strokeWidth={2.2} aria-hidden="true" /> Déconnexion
                                </button>
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard title="Gestion des données" icon={Database}>
                        <p className="text-[13px] text-[var(--text-secondary)] tracking-tight leading-relaxed">
                            Vide les préférences et données mises en cache dans votre navigateur (thème, langue, notifications, etc.).
                            Les données serveur ne sont pas affectées.
                        </p>
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => setConfirmClearOpen(true)}
                                className="btn-secondary !text-[12px] !text-red-700 dark:!text-red-300 !bg-red-50 dark:!bg-red-500/10 !border-red-100 dark:!border-red-500/25 hover:!border-red-200 dark:hover:!border-red-500/40"
                            >
                                <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" /> Vider le cache local
                            </button>
                        </div>
                    </SettingsCard>
                </div>

                <div className="space-y-6">
                    <SettingsCard title="Préférences" icon={Palette}>
                        <div>
                            <span id="theme-label" className="field-label">Thème de l'application</span>
                            <div className="flex gap-2" role="group" aria-labelledby="theme-label">
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    aria-pressed={!isDark}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-[13px] font-medium tracking-tight transition active:translate-y-[1px] ${!isDark ? 'border-orange-200 bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/25' : 'border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-orange-200 dark:hover:border-orange-500/30'}`}
                                >
                                    <Sun size={15} strokeWidth={2.2} aria-hidden="true" /> Clair
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    aria-pressed={isDark}
                                    className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-[13px] font-medium tracking-tight transition active:translate-y-[1px] ${isDark ? 'border-orange-200 bg-orange-50 text-orange-700 ring-1 ring-orange-100 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-200 dark:ring-orange-500/25' : 'border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-orange-200 dark:hover:border-orange-500/30'}`}
                                >
                                    <Moon size={15} strokeWidth={2.2} aria-hidden="true" /> Sombre
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <label className="field-label !mb-0" htmlFor="language-select">Langue</label>
                                <span className="num inline-flex items-center gap-1 text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-[var(--border-subtle)]">
                                    <Clock size={9} strokeWidth={2.4} aria-hidden="true" /> bientôt
                                </span>
                            </div>
                            <Tooltip comingSoon content="La traduction de l'interface arrivera prochainement.">
                                <select
                                    id="language-select"
                                    value={language}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        if (next === 'fr' || next === 'en') setLanguage(next);
                                    }}
                                    disabled
                                    aria-disabled="true"
                                    className="field-input cursor-not-allowed opacity-60"
                                >
                                    <option value="fr">Français</option>
                                    <option value="en">English</option>
                                </select>
                            </Tooltip>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 tracking-tight">
                                La traduction de l'interface arrivera prochainement.
                            </p>
                        </div>
                    </SettingsCard>

                    <SettingsCard title="Notifications" icon={Bell}>
                        <Toggle
                            label="Résumé hebdomadaire par e-mail"
                            enabled={notifications.summary}
                            setEnabled={(v) => setNotification('summary', v)}
                        />
                        <Toggle
                            label="Alertes critiques (ex: échec d'import)"
                            enabled={notifications.alerts}
                            setEnabled={(v) => setNotification('alerts', v)}
                        />
                        <Toggle
                            label="Nouveautés et mises à jour"
                            enabled={notifications.news}
                            setEnabled={(v) => setNotification('news', v)}
                        />
                    </SettingsCard>

                    <SettingsCard title="Import de données" icon={Upload}>
                        <p className="text-[13px] text-[var(--text-secondary)] tracking-tight leading-relaxed">
                            Importez vos fichiers CSV ou Excel pour mettre à jour les communes, équipes
                            et autres données.
                        </p>
                        <div className="flex justify-start">
                            <button type="button" onClick={() => navigate('/upload')} className="btn-primary">
                                <Upload size={14} strokeWidth={2.2} aria-hidden="true" /> Ouvrir l'import
                            </button>
                        </div>
                    </SettingsCard>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmClearOpen}
                onClose={() => setConfirmClearOpen(false)}
                onConfirm={handleClearCache}
                title="Vider le cache local ?"
                message={
                    <>
                        Cela supprimera votre thème, votre langue, vos préférences de notifications
                        et toutes les données mises en cache par WesserPlan dans ce navigateur. Les
                        données serveur ne sont pas affectées.
                        <br />
                        <br />
                        La page sera rechargée pour appliquer tous les changements.
                    </>
                }
                confirmLabel="Vider le cache"
                variant="danger"
            />

            {toast && <Toast message={toast} />}
        </section>
    );
};

export default SettingsTab;
