import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, Building, Home, Truck } from 'lucide-react';

const DropZone: React.FC<{ title: string; description: string; icon: React.ElementType }> = ({ title, description, icon: Icon }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        // Handle file upload logic here
        const files = event.dataTransfer.files;
        console.log(files);
        // You would typically process the files here
    }, []);

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-3">
                <Icon className="text-highlight-text" />
                {title}
            </h3>
            <p className="text-sm text-text-secondary mb-4">{description}</p>
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex justify-center w-full h-32 px-4 transition bg-white/50 dark:bg-[var(--bg-card-solid)]/50 border-2 ${isDragOver ? 'border-highlight-text' : 'border-gray-300 dark:border-slate-600'} border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none`}>
                <span className="flex items-center space-x-2">
                    <UploadCloud className={`mx-auto h-10 w-10 ${isDragOver ? 'text-highlight-text' : 'text-[var(--text-secondary)]'}`} />
                    <span className="font-medium text-[var(--text-secondary)]">
                        Glissez et déposez vos fichiers ici, ou{' '}
                        <span className="text-blue-600 underline">parcourez</span>
                    </span>
                </span>
                <input type="file" name="file_upload" className="hidden" />
            </label>
        </div>
    );
};

const UploadTab: React.FC = () => {
    return (
        <section className="animate-fade-in">
            <header className="mb-8">
                <h2 className="text-4xl font-extrabold text-text-primary">Importer des Données</h2>
                <p className="text-lg text-text-secondary mt-2">Mettez à jour l'application avec vos derniers fichiers de données.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DropZone
                    title="Données des Communes"
                    description="Importez la liste des communes avec leurs statuts, populations, et informations de contact. Formats acceptés : CSV, JSON."
                    icon={Building}
                />
                <DropZone
                    title="Logements Opérationnels"
                    description="Mettez à jour la base de données des logements utilisés par les équipes. Formats acceptés : CSV, XLSX."
                    icon={Home}
                />
                <DropZone
                    title="Flotte de Véhicules"
                    description="Importez les données à jour de la flotte, incluant kilométrage et dates de révision. Formats acceptés : CSV."
                    icon={Truck}
                />
                <DropZone
                    title="Rapports de Performance"
                    description="Chargez les rapports hebdomadaires ou mensuels pour analyse. Formats acceptés : PDF, XLSX."
                    icon={FileText}
                />
            </div>
        </section>
    );
};

export default UploadTab;
