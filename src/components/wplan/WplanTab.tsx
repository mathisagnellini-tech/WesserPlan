import React from 'react';
import { MapPin, Target } from 'lucide-react';
import { useWplanData } from '@/hooks/useWplanData';
import { useWplanMap } from '@/hooks/useWplanMap';
import { useDepartmentWeather } from '@/hooks/useWeather';
import DataLibraryModal from '@/components/wplan/DataLibraryModal';
import WplanHeader from '@/components/wplan/WplanHeader';
import MultiSelectDropdown from '@/components/wplan/MultiSelectDropdown';
import MapPanel from '@/components/wplan/MapPanel';
import ChartPanel from '@/components/wplan/ChartPanel';
import SwotMatrix from '@/components/wplan/SwotMatrix';

const WplanTab: React.FC = () => {
    const {
        regionGeoJSON,
        departmentGeoJSON,
        geoError,
        retryGeo,
        mapLevel,
        viewingRegion,
        selectedItem,
        comparisonItem,
        isComparing,
        showEvents,
        isDataLibraryOpen,
        activeMetric,
        filters,
        chartTitle,
        chartConfig,
        selectedRegionName,
        selectedDeptCode,
        regionOptions,
        departmentOptions,
        nationalKpis,
        kpisLoading,
        kpisError,
        refetchKpis,
        setSelectedItem,
        setComparisonItem,
        setShowEvents,
        setIsDataLibraryOpen,
        setActiveMetric,
        handleMultiSelectChange,
        handleClearFilter,
        handleBackToRegions,
        handleSetMapLevel,
        handleToggleCompare,
    } = useWplanData();

    const { mapContainerRef, mapInstanceRef } = useWplanMap({
        regionGeoJSON,
        departmentGeoJSON,
        mapLevel,
        viewingRegion,
        selectedItem,
        comparisonItem,
        isComparing,
        showEvents,
        activeMetric,
        filters,
        setSelectedItem,
        setComparisonItem,
    });

    // Weather feed for the currently-selected department (drives correlation chart
    // and the Data Lab weather widget). Falls back to undefined when no dept selected.
    const { data: weatherData, isLoading: weatherLoading, error: weatherError } =
        useDepartmentWeather(selectedDeptCode || undefined);

    return (
        <section>
            <DataLibraryModal
                isOpen={isDataLibraryOpen}
                onClose={() => setIsDataLibraryOpen(false)}
                selectedDeptCode={selectedDeptCode}
            />

            {geoError && (
                <div role="alert" className="mb-4 glass-card p-4 border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-2">
                        Carte indisponible — chargement du fond géographique impossible.
                    </p>
                    <button
                        type="button"
                        onClick={retryGeo}
                        className="text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            <WplanHeader
                mapLevel={mapLevel}
                viewingRegion={viewingRegion}
                isComparing={isComparing}
                onSetMapLevel={handleSetMapLevel}
                onOpenDataLibrary={() => setIsDataLibraryOpen(true)}
                onBackToRegions={() => handleBackToRegions(mapInstanceRef)}
                onToggleCompare={handleToggleCompare}
            />

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-50">
                <MultiSelectDropdown
                    options={regionOptions}
                    selected={filters.regions}
                    onSelectionChange={(val) => handleMultiSelectChange('regions', val)}
                    onClear={() => handleClearFilter('regions')}
                    title="Toutes les Régions"
                    icon={<MapPin size={18} />}
                    disabled={mapLevel === 'departments' || !!viewingRegion}
                />
                <MultiSelectDropdown
                    options={departmentOptions}
                    selected={filters.departments}
                    onSelectionChange={(val) => handleMultiSelectChange('departments', val)}
                    onClear={() => handleClearFilter('departments')}
                    title="Tous les Départements"
                    icon={<Target size={18} />}
                    disabled={mapLevel === 'regions' && !viewingRegion}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-0">
                <MapPanel
                    mapContainerRef={mapContainerRef}
                    regionGeoJSON={regionGeoJSON}
                    departmentGeoJSON={departmentGeoJSON}
                    activeMetric={activeMetric}
                    mapLevel={mapLevel}
                    selectedItem={selectedItem}
                    comparisonItem={comparisonItem}
                    viewingRegion={viewingRegion}
                    isComparing={isComparing}
                    showEvents={showEvents}
                    onActiveMetricChange={setActiveMetric}
                    onShowEventsChange={setShowEvents}
                />
                <ChartPanel
                    chartTitle={chartTitle}
                    chartConfig={chartConfig}
                    isComparing={isComparing}
                    nationalKpis={nationalKpis}
                    kpisLoading={kpisLoading}
                    kpisError={kpisError}
                    onRetryKpis={refetchKpis}
                    weatherData={weatherData}
                    weatherLoading={weatherLoading}
                    weatherError={weatherError}
                    selectedDeptCode={selectedDeptCode}
                />
            </div>

            <SwotMatrix regionName={selectedRegionName} nationalKpis={nationalKpis} />
        </section>
    );
};

export default WplanTab;
