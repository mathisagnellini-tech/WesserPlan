
import { Commune, Cluster, ClusteringResult } from '../types';
import { 
  CLUSTER_COLORS, DEPT_CODE, 
  MIN_1W, MAX_1W, 
  MIN_2W, MAX_2W, 
  MIN_3W, MAX_3W 
} from '../constants';

export const calculateDuration = (pop: number): number => {
    if (pop >= MIN_3W) return 3;
    if (pop >= MIN_2W) return 2;
    return 1;
};

export const getZoneStatus = (pop: number) => {
    if (pop >= MIN_1W && pop <= MAX_1W) return { label: 'Prêt (1 sem)', color: 'text-emerald-500', valid: true };
    if (pop >= MIN_2W && pop <= MAX_2W) return { label: 'Prêt (2 sem)', color: 'text-emerald-500', valid: true };
    if (pop >= MIN_3W && pop <= MAX_3W) return { label: 'Prêt (3 sem)', color: 'text-emerald-500', valid: true };
    if (pop < MIN_1W) return { label: 'Population insuffisante', color: 'text-amber-500', valid: false };
    return { label: 'Population hors paliers', color: 'text-red-500', valid: false };
};

export const generateClusters = (allCommunes: Commune[], targetPop: number): ClusteringResult => {
  return { clusters: [], unclustered: [] };
};

export const recalculateSchedule = (
    clusters: Cluster[], 
    weekOverrides: Record<number, number>, 
    defaultTeamCount: number
): Cluster[] => {
    return clusters.map((cluster, index) => {
        // On attribue une couleur basée sur l'index de création pour que même les brouillons aient une couleur unique
        const colorIndex = index % CLUSTER_COLORS.length;
        cluster.color = CLUSTER_COLORS[colorIndex];
        return cluster;
    });
};
