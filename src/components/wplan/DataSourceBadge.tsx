import React from 'react';
import { FlaskConical, Clock3 } from 'lucide-react';

/**
 * Visible chip used by Wplan widgets to disclose, at a glance, whether the
 * numbers in a card come from a real backend or from a deterministic
 * placeholder (synthesised) / unfinished feature (coming soon).
 *
 * Two variants:
 *   - `synthetic`  — amber tone, "Données synthétiques" by default. Used when
 *     the widget renders deterministic / hash-derived numbers because no
 *     backend endpoint exists yet.
 *   - `comingSoon` — slate tone, "Bientôt disponible" by default. Used on
 *     placeholder widgets that don't render any meaningful figure yet.
 *
 * Lives in `src/components/wplan/` on purpose — it is only used by Wplan
 * widgets and we don't want to leak project-internal "honesty" semantics into
 * the shared `ui/` primitives.
 */
export type DataSourceBadgeVariant = 'synthetic' | 'comingSoon';

interface DataSourceBadgeProps {
    variant: DataSourceBadgeVariant;
    /** Override the default label for the chosen variant. */
    label?: string;
    /** Optional title attribute for native browser tooltip on hover. */
    title?: string;
    className?: string;
}

const VARIANT_DEFAULTS: Record<DataSourceBadgeVariant, { label: string; title: string }> = {
    synthetic: {
        label: 'Données synthétiques',
        title:
            "Ces chiffres sont générés localement (hash déterministe) en attendant un endpoint backend dédié.",
    },
    comingSoon: {
        label: 'Bientôt disponible',
        title:
            "Cet indicateur est un aperçu — il sera branché à un vrai dataset dans une prochaine itération.",
    },
};

const VARIANT_CLASSES: Record<DataSourceBadgeVariant, string> = {
    synthetic:
        'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    comingSoon:
        'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
};

const ICONS: Record<DataSourceBadgeVariant, React.ReactNode> = {
    synthetic: <FlaskConical size={10} />,
    comingSoon: <Clock3 size={10} />,
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
    variant,
    label,
    title,
    className = '',
}) => {
    const defaults = VARIANT_DEFAULTS[variant];
    return (
        <span
            // role="status" — screen readers announce a small status change next
            // to the title, so the disclosure is accessible too.
            role="status"
            title={title ?? defaults.title}
            className={`inline-flex items-center gap-1 text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-md border whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`}
        >
            {ICONS[variant]}
            {label ?? defaults.label}
        </span>
    );
};

export default DataSourceBadge;
