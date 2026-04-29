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
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
            <Icon className="text-[var(--highlight-text)]" />
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
            <span className="text-sm text-[var(--text-secondary)]">{label}</span>
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in"
    >
        <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700">
            <Check size={18} className="text-orange-400" />
            <span className="font-medium text-sm">{message}</span>
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
        <section className="animate-fade-in">
            <header className="mb-4 md:mb-8 mt-2">
                <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Paramètres</h2>
                <p className="text-sm md:text-lg text-[var(--text-secondary)] mt-1 font-medium">Gérez votre profil, vos préférences et les données de l'application.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <SettingsCard title="Profil Utilisateur" icon={User}>
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
                                        className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-2 rounded-lg cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]"
                                    >
                                        Changer d'avatar
                                    </button>
                                </Tooltip>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Bientôt disponible.</p>
                            </div>
                        </div>

                        <div
                            id={profileHintId}
                            className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-sm text-blue-900 dark:text-blue-300"
                        >
                            <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{PROFILE_SYNC_HINT}</span>
                        </div>

                        <div>
                            <label
                                htmlFor={nameId}
                                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                            >
                                Nom complet
                            </label>
                            <input
                                id={nameId}
                                type="text"
                                value={userName ?? ''}
                                readOnly
                                aria-readonly="true"
                                aria-describedby={profileHintId}
                                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-2.5 cursor-not-allowed opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor={emailId}
                                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                            >
                                Adresse e-mail
                            </label>
                            <input
                                id={emailId}
                                type="email"
                                value={userEmail ?? ''}
                                readOnly
                                aria-readonly="true"
                                aria-describedby={profileHintId}
                                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-2.5 cursor-not-allowed opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                            />
                        </div>
                        {isAuthenticated && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]"
                                >
                                    <LogOut size={16} aria-hidden="true" /> Déconnexion
                                </button>
                            </div>
                        )}
                    </SettingsCard>

                    <SettingsCard title="Gestion des Données" icon={Database}>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Vide les préférences et données mises en cache dans votre navigateur (thème, langue, notifications, etc.).
                            Les données serveur ne sont pas affectées.
                        </p>
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => setConfirmClearOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/10 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]"
                            >
                                <Trash2 size={16} aria-hidden="true" /> Vider le cache local
                            </button>
                        </div>
                    </SettingsCard>
                </div>

                <div className="space-y-8">
                    <SettingsCard title="Préférences" icon={Palette}>
                        <div>
                            <span id="theme-label" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Thème de l'application
                            </span>
                            <div className="flex gap-2" role="group" aria-labelledby="theme-label">
                                <button
                                    type="button"
                                    onClick={() => setTheme('light')}
                                    aria-pressed={!isDark}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] ${!isDark ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm' : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-slate-300 dark:hover:border-slate-500'}`}
                                >
                                    <Sun size={18} aria-hidden="true" /> Clair
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTheme('dark')}
                                    aria-pressed={isDark}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)] ${isDark ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 shadow-sm' : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-secondary)] hover:border-slate-300 dark:hover:border-slate-500'}`}
                                >
                                    <Moon size={18} aria-hidden="true" /> Sombre
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="language-select">Langue</label>
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <Clock size={10} aria-hidden="true" /> Bientôt
                                </span>
                            </div>
                            {/* i18n is not wired up yet (no react-i18next), so the selector is held
                                in placeholder mode behind a Tooltip rather than letting users pick a
                                value that has no UI effect. */}
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
                                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 transition p-2.5 cursor-not-allowed opacity-60"
                                >
                                    <option value="fr">Français</option>
                                    <option value="en">English</option>
                                </select>
                            </Tooltip>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
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
                        <p className="text-sm text-[var(--text-secondary)]">
                            Importez vos fichiers CSV ou Excel pour mettre à jour les communes, équipes
                            et autres données.
                        </p>
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => navigate('/upload')}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/90 transition shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]"
                            >
                                <Upload size={16} aria-hidden="true" /> Ouvrir l'import
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
