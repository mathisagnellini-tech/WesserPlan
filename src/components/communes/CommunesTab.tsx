import React from 'react';
import { useCommunesData } from '@/hooks/useCommunesData';
import { useCommuneListMap } from '@/hooks/useCommuneListMap';
import { CommuneListPanel } from '@/components/communes/CommuneListPanel';
import { CommuneDetailPanel } from '@/components/communes/CommuneDetailPanel';
import { ProspectionMap } from '@/components/communes/ProspectionMap';
import { ProspectValidationModal } from '@/components/communes/ProspectValidationModal';

const CommunesTab: React.FC = () => {
    const {
        mode, setMode,
        selectedOrg, setSelectedOrg,
        search, setSearch,
        selectedRegions, setSelectedRegions,
        selectedDepts, setSelectedDepts,
        selectedStatuses, toggleStatus, resetStatuses,
        availableRegionsOptions, availableDeptsOptions,
        filteredCommunes,
        selectedCommune, setSelectedCommune,
        handleUpdateCommune,
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
    } = useCommunesData();

    const { mapContainerRef } = useCommuneListMap(
        filteredCommunes,
        mode,
        setSelectedCommune,
    );

    return (
        <section className="min-h-[calc(100vh-150px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
            {/* VALIDATION MODAL */}
            <ProspectValidationModal
                isOpen={!!validationData}
                onClose={() => setValidationData(null)}
                onConfirm={handleConfirmValidation}
                communes={validationData?.communes || []}
                stats={validationData?.stats || {count:0, pop:0, zones:"0"}}
            />

            {/* Left List Panel */}
            <CommuneListPanel
                mode={mode}
                setMode={setMode}
                selectedOrg={selectedOrg}
                setSelectedOrg={setSelectedOrg}
                search={search}
                setSearch={setSearch}
                selectedRegions={selectedRegions}
                setSelectedRegions={setSelectedRegions}
                selectedDepts={selectedDepts}
                setSelectedDepts={setSelectedDepts}
                selectedStatuses={selectedStatuses}
                toggleStatus={toggleStatus}
                resetStatuses={resetStatuses}
                availableRegionsOptions={availableRegionsOptions}
                availableDeptsOptions={availableDeptsOptions}
                filteredCommunes={filteredCommunes}
                selectedCommune={selectedCommune}
                setSelectedCommune={setSelectedCommune}
                onUpdateCommune={handleUpdateCommune}
                pastRequests={pastRequests}
            />

            {/* Right Details & Map Panel */}
            <div className="flex-1 flex flex-col gap-6 min-h-[400px] md:min-h-0">
                {mode === 'list' ? (
                    <>
                        <CommuneDetailPanel
                            commune={selectedCommune}
                            onUpdateCommune={handleUpdateCommune}
                        />
                        <div className="flex-grow min-h-[300px] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)] relative">
                            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                        </div>
                    </>
                ) : (
                    <ProspectionMap
                        departments={selectedDepts}
                        onValidationRequest={handleMapValidationRequest}
                    />
                )}
            </div>
        </section>
    );
};

export default CommunesTab;
