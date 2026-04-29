import { Link } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
        <MapPin size={40} />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">
          404 — Page introuvable
        </h1>
        <p className="text-base text-[var(--text-secondary)] max-w-md">
          Cette page n'existe pas ou a été déplacée. Vérifiez l'URL ou retournez à l'accueil.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity shadow-sm"
      >
        <Home size={16} />
        Retour à l'accueil
      </Link>
    </div>
  );
}
