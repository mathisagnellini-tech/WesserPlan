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
        activeRegion, setActiveRegion,
        search, setSearch,
        selectedRegions, setSelectedRegions,
        selectedDepts, setSelectedDepts,
        selectedStatuses, toggleStatus, resetStatuses,
        availableRegionsOptions, availableDeptsOptions,
        filteredCommunes, totalCommunes,
        selectedCommune, setSelectedCommune,
        handleUpdateCommune,
        isLoading, isSubmitting,
        effectiveDept,
        pastRequests,
        validationData, setValidationData,
        handleMapValidationRequest, handleConfirmValidation,
        validationError, setValidationError,
        validationSuccess, setValidationSuccess,
        updateError, setUpdateError,
        error, geoError,
    } = useCommunesData();

    const { mapContainerRef } = useCommuneListMap(
        filteredCommunes,
        mode,
        setSelectedCommune,
    );

    return (
        <section className="app-surface min-h-[calc(100vh-150px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
            <ProspectValidationModal
                isOpen={!!validationData || !!validationSuccess}
                onClose={() => {
                    setValidationData(null);
                    setValidationError(null);
                    setValidationSuccess(null);
                }}
                onConfirm={handleConfirmValidation}
                communes={validationData?.communes || []}
                stats={validationData?.stats || { count: 0, pop: 0, zones: '0' }}
                isSubmitting={isSubmitting}
                submitError={validationError}
                submitSuccess={validationSuccess}
                onDismissError={() => setValidationError(null)}
                onDismissSuccess={() => setValidationSuccess(null)}
            />

            <CommuneListPanel
                mode={mode}
                setMode={setMode}
                selectedOrg={selectedOrg}
                setSelectedOrg={setSelectedOrg}
                activeRegion={activeRegion}
                setActiveRegion={setActiveRegion}
                isLoading={isLoading}
                loadError={error}
                geoError={geoError}
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
                totalCommunes={totalCommunes}
                selectedCommune={selectedCommune}
                setSelectedCommune={setSelectedCommune}
                onUpdateCommune={handleUpdateCommune}
                pastRequests={pastRequests}
            />

            <div className="flex-1 flex flex-col gap-6 min-h-[400px] md:min-h-0">
                {mode === 'list' ? (
                    <>
                        <CommuneDetailPanel
                            commune={selectedCommune}
                            onUpdateCommune={handleUpdateCommune}
                            updateError={updateError}
                            onDismissUpdateError={() => setUpdateError(null)}
                        />
                        <div className="flex-grow min-h-[300px] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)] relative">
                            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                        </div>
                    </>
                ) : (
                    <ProspectionMap
                        key={effectiveDept ?? 'none'}
                        department={effectiveDept}
                        onValidationRequest={handleMapValidationRequest}
                    />
                )}
            </div>
        </section>
    );
};

export default CommunesTab;
