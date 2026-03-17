
import React, { useEffect, useRef, useState } from 'react';
import { Cluster, Commune } from '../types';

declare const L: any;

interface MapCanvasProps {
  clusters: Cluster[];
  allCommunes: Commune[];
  onSelectCluster: (cluster: Cluster) => void;
  selectedClusterId?: string;
  isEditMode: boolean;
  isBrushMode: boolean;
  brushSelection: Set<string>;
  bonusSelection?: Set<string>; // Ajouté pour le mode BONUS
  onCommuneBrush: (communeId: string, forceState?: boolean) => void;
  onCommuneHover: (commune: Commune | null) => void;
  visibleTeamPath?: number | null;
  onCommuneClick?: (communeId: string) => void;
  focusedCommuneId?: string | null;
}

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  clusters, 
  allCommunes,
  onSelectCluster, 
  selectedClusterId, 
  isEditMode,
  isBrushMode,
  brushSelection,
  bonusSelection,
  onCommuneBrush,
  onCommuneHover,
  visibleTeamPath,
  onCommuneClick,
  focusedCommuneId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const isPaintingRef = useRef<boolean | null>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredData, setHoveredData] = useState<Commune | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, { 
        zoomControl: false,
        attributionControl: false
    }).setView([47.1, 6.4], 9);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO', opacity: 0.15
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', opacity: 0.15, filter: 'grayscale(1)'
      }).addTo(map);
    }

    mapInstanceRef.current = map;
    labelLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    const handleMouseMove = (e: MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleGlobalMouseUp = () => { isPaintingRef.current = null; };
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => { 
        if (mapInstanceRef.current) mapInstanceRef.current.remove(); 
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);
    labelLayerRef.current?.clearLayers();
    routeLayerRef.current?.clearLayers();

    const features = allCommunes.map(commune => {
      const cluster = clusters.find(c => c.communes.some(com => com.id === commune.id));
      const f = JSON.parse(JSON.stringify(commune.feature));
      f.properties = {
        ...f.properties,
        communeId: commune.id,
        clusterId: cluster?.id,
        color: cluster?.color || '#cbd5e1',
        isAssigned: !!cluster,
        isPending: brushSelection.has(commune.id) || (bonusSelection && bonusSelection.has(commune.id)),
        status: commune.status,
        communeData: commune 
      };
      return f;
    });

    const geoJsonLayer = L.geoJSON(features as any, {
      style: (feature: any) => {
        const props = feature.properties;
        const isPending = props.isPending;
        const isSelected = props.clusterId === selectedClusterId;
        const isFocused = props.communeId === focusedCommuneId;

        let weight = props.isAssigned ? 3 : 0.8;
        let color = props.isAssigned ? props.color : '#cbd5e1';
        let fillColor = props.isAssigned ? props.color : '#f8fafc';
        let fillOpacity = props.isAssigned ? 0.2 : 0.4;
        let dashArray = props.isAssigned ? '' : '3, 3';

        if (isPending) {
          fillColor = '#3b82f6';
          fillOpacity = 0.6;
          weight = 4;
          color = '#2563eb';
          dashArray = '';
        }

        if (isSelected) {
          weight = 5;
          color = '#1e293b';
          fillOpacity = 0.4;
          dashArray = '';
        }

        if (isFocused) {
          weight = 8;
          color = '#f59e0b';
          dashArray = '';
        }

        return { fillColor, weight, opacity: 1, color, fillOpacity, dashArray };
      },
      onEachFeature: (feature, layer) => {
        const handleBrushAction = () => {
            if (!isBrushMode) return;
            const cid = feature.properties.communeId;
            if (feature.properties.isAssigned) return;

            if (isPaintingRef.current === null) {
                isPaintingRef.current = !brushSelection.has(cid);
            }
            onCommuneBrush(cid, isPaintingRef.current);
        };

        layer.on({
          mouseover: (e) => {
            const data = feature.properties.communeData;
            setHoveredData(data);
            onCommuneHover(data);
            
            if (isBrushMode && (e.originalEvent as MouseEvent).buttons === 1) {
              handleBrushAction();
            }

            const target = e.target as L.Path;
            target.setStyle({ weight: 6, fillOpacity: 0.6 });
          },
          mouseout: (e) => {
            setHoveredData(null);
            onCommuneHover(null);
            geoJsonLayer.resetStyle(e.target);
          },
          mousedown: (e) => {
            if (isBrushMode) {
              L.DomEvent.stopPropagation(e);
              handleBrushAction();
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            if (isBrushMode) return;
            
            if (onCommuneClick) {
              onCommuneClick(feature.properties.communeId);
            }

            if (feature.properties.clusterId) {
              const cluster = clusters.find(c => c.id === feature.properties.clusterId);
              if (cluster) onSelectCluster(cluster);
            }
          }
        });
      }
    }).addTo(map);

    if (visibleTeamPath !== null && routeLayerRef.current) {
        const teamZones = clusters
            .filter(c => c.assignedTeam === visibleTeamPath)
            .sort((a, b) => a.startWeek - b.startWeek);

        const pathPoints: L.LatLngExpression[] = [];
        teamZones.forEach(cluster => {
            const valid = cluster.communes.filter(com => com.centroid);
            if (valid.length > 0) {
                const avgX = valid.reduce((acc, com) => acc + com.centroid![0], 0) / valid.length;
                const avgY = valid.reduce((acc, com) => acc + com.centroid![1], 0) / valid.length;
                pathPoints.push([avgY, avgX]);
            }
        });

        if (pathPoints.length > 1) {
            L.polyline(pathPoints, {
                color: '#6366f1',
                weight: 12,
                opacity: 0.1,
                lineCap: 'round'
            }).addTo(routeLayerRef.current);

            L.polyline(pathPoints, {
                color: '#4f46e5',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10',
                lineCap: 'round'
            }).addTo(routeLayerRef.current);

            for (let i = 0; i < pathPoints.length - 1; i++) {
                const start = pathPoints[i] as [number, number];
                const end = pathPoints[i+1] as [number, number];
                const mid: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
                const angle = Math.atan2(end[0] - start[0], end[1] - start[1]) * 180 / Math.PI;

                L.marker(mid, {
                    icon: L.divIcon({
                        className: 'arrow-icon',
                        html: `<div style="transform: rotate(${angle - 90}deg); color: #4f46e5; font-size: 20px; font-weight: bold;">➤</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    }),
                    interactive: false
                }).addTo(routeLayerRef.current);
            }

            pathPoints.forEach((pt, i) => {
                L.circleMarker(pt, {
                    radius: 6,
                    fillColor: 'white',
                    color: '#4f46e5',
                    weight: 3,
                    fillOpacity: 1
                }).addTo(routeLayerRef.current!);
                
                L.marker(pt, {
                    icon: L.divIcon({
                        className: 'step-label',
                        html: `<div style="color: #4f46e5; font-weight: 900; font-size: 10px; margin-top: 15px; background: white; padding: 2px 4px; border-radius: 4px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${i + 1}</div>`,
                        iconSize: [0, 0]
                    }),
                    interactive: false
                }).addTo(routeLayerRef.current!);
            });
        }
    }

    clusters.filter(c => c.code).forEach(cluster => {
        const valid = cluster.communes.filter(com => com.centroid);
        if (valid.length > 0) {
            const avgX = valid.reduce((acc, com) => acc + com.centroid![0], 0) / valid.length;
            const avgY = valid.reduce((acc, com) => acc + com.centroid![1], 0) / valid.length;
            L.marker([avgY, avgX], { 
                icon: L.divIcon({
                    className: 'map-label',
                    html: `
                      <div style="
                        background: white; 
                        border: 3px solid ${cluster.color}; 
                        color: #1e293b; 
                        font-family: 'Inter', sans-serif;
                        font-weight: 900; 
                        padding: 4px 12px; 
                        border-radius: 99px; 
                        font-size: 13px; 
                        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); 
                        white-space: nowrap;
                        transform: translate(-50%, -50%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        letter-spacing: -0.02em;
                      ">
                        ${cluster.code}
                      </div>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                }), 
                interactive: false 
            }).addTo(labelLayerRef.current!);
        }
    });

    geoJsonLayerRef.current = geoJsonLayer;
  }, [clusters, allCommunes, brushSelection, bonusSelection, isBrushMode, selectedClusterId, visibleTeamPath, focusedCommuneId, onCommuneClick, onSelectCluster]); // Dépendances complétées

  return (
    <div className="w-full h-full relative z-0 bg-slate-50 dark:bg-slate-900 cursor-crosshair">
       <div ref={mapContainerRef} className="w-full h-full" />
       
       {hoveredData && (
           <div 
             className="fixed z-[1000] pointer-events-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shadow-2xl flex flex-col gap-0.5 animate-in fade-in zoom-in duration-150 ring-1 ring-black/5"
             style={{ 
                 left: mousePos.x + 20, 
                 top: mousePos.y + 20 
             }}
           >
             <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{hoveredData.id}</div>
             <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">{hoveredData.name}</div>
             <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{hoveredData.population.toLocaleString()} habitants</div>
           </div>
       )}

       <style>{`
          .map-label { pointer-events: none; }
          .arrow-icon { pointer-events: none; }
          .step-label { pointer-events: none; display: flex; justify-content: center; }
          .leaflet-interactive { transition: fill-opacity 0.2s, stroke-width 0.2s, stroke 0.2s; outline: none; }
          .leaflet-container { cursor: crosshair !important; background: #f1f5f9 !important; }
          .dark .leaflet-container { background: #0f172a !important; }
       `}</style>
    </div>
  );
};

export default MapCanvas;
