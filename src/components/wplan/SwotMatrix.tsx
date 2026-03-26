import React from 'react';
import { Lightbulb, AlertTriangle, Ban, CheckCircle2, TrendingUp } from 'lucide-react';

interface SwotMatrixProps {
    regionName: string | undefined;
}

const SwotMatrix: React.FC<SwotMatrixProps> = ({ regionName }) => {
    return (
        <div className="grid grid-cols-1 gap-6 mt-6 relative z-0">
            <div className="glass-card p-6 flex flex-col">
                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Lightbulb className="text-yellow-500" size={20} />
                    Matrice SWOT : {regionName || 'France Entière'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                        <h4 className="text-xs font-bold text-green-800 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Forces
                        </h4>
                        <ul className="text-xs text-green-900 dark:text-green-300 space-y-1 list-disc list-inside">
                            <li>Forte conversion périurbaine</li>
                            <li>Anciens donateurs fidèles (+6m)</li>
                            <li>Image de marque positive locale</li>
                        </ul>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                        <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle size={12} /> Faiblesses
                        </h4>
                        <ul className="text-xs text-orange-900 dark:text-orange-300 space-y-1 list-disc list-inside">
                            <li>Saturation centre-ville</li>
                            <li>Coût par acquisition élevé</li>
                        </ul>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                        <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase mb-2 flex items-center gap-1">
                            <TrendingUp size={12} /> Opportunités
                        </h4>
                        <ul className="text-xs text-orange-900 dark:text-orange-300 space-y-1 list-disc list-inside">
                            <li>Marchés de Noël (Q4)</li>
                            <li>Nouvelles zones résidentielles Nord</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
                        <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase mb-2 flex items-center gap-1">
                            <Ban size={12} /> Menaces
                        </h4>
                        <ul className="text-xs text-red-900 dark:text-red-300 space-y-1 list-disc list-inside">
                            <li>Météo difficile en Janvier</li>
                            <li>Concurrence ONG accrue (S40-44)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwotMatrix;
