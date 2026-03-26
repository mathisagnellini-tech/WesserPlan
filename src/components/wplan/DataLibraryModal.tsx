import React from 'react';
import { X, Library } from 'lucide-react';
import { dataLibraryData } from '@/constants';
import { GoldenHourWidget, WeatherCorrelatorWidget, GenomeWidget, SeismographWidget } from '@/components/wplan/DataLabWidgets';

interface DataLibraryModalProps {
    onClose: () => void;
}

const DataLibraryModal: React.FC<DataLibraryModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] animate-fade-in flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>

            <div className="relative bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/50" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="flex justify-between items-center p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                            <Library className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tight">Data Lab <span className="text-orange-500">.</span></h3>
                            <p className="text-slate-400 text-sm font-medium">Observatoire de la donnée terrain & Intelligence Artificielle</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
                </header>

                <div className="overflow-y-auto custom-scrollbar p-8">
                    {/* Section 1: Live Widgets */}
                    <div className="mb-12">
                        <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Insights Temps Réel
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <GoldenHourWidget />
                            <WeatherCorrelatorWidget />
                            <GenomeWidget />
                            <SeismographWidget />
                        </div>
                    </div>

                    {/* Section 2: Catalogue */}
                    <div className="mb-8">
                        <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Catalogue de Données
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {dataLibraryData.categories.map((category) => (
                                <div key={category.nom} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-orange-500/30 transition-colors group">
                                    <h5 className="font-bold text-orange-400 mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                                        {category.nom}
                                        <span className="text-slate-600 text-[10px] bg-slate-800 px-2 py-1 rounded-full group-hover:text-white transition-colors">{category.items.length}</span>
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {category.items.map(item => (
                                            <span key={item} className="bg-slate-900 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 group-hover:border-slate-600 transition-colors cursor-default">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataLibraryModal;
