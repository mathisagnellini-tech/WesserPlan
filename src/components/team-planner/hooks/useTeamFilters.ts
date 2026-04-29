
import { useState, useMemo } from 'react';
import { FilterState, BoardData, Column, Person } from '../types';

export function useTeamFilters(currentData: BoardData) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
      roles: [],
      contractStatus: [],
      tags: [],
      ngos: []
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
      setFilters(prev => {
          const current = prev[key];
          if (current.includes(value)) {
              return { ...prev, [key]: current.filter(item => item !== value) };
          } else {
              return { ...prev, [key]: [...current, value] };
          }
      });
  };

  const handleClearFilters = () => {
      setFilters({ roles: [], contractStatus: [], tags: [], ngos: [] });
  };

  const availableNgos = useMemo(() => {
      const set = new Set<string>();
      (Object.values(currentData.columns) as Column[]).forEach(col => {
          const ngo = col.title.split(' ')[0];
          if(ngo) set.add(ngo);
      });
      return Array.from(set);
  }, [currentData]);

  const activeFilterCount = Object.values(filters).flat().length;

  const filterCards = (cards: Person[]): Person[] => {
      return cards.filter(card => {
          if (searchQuery) {
              const lowerQuery = searchQuery.toLowerCase();
              const matchesSearch = card.name.toLowerCase().includes(lowerQuery) ||
                                  card.role.toLowerCase().includes(lowerQuery) ||
                                  card.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
              if (!matchesSearch) return false;
          }
          if (filters.roles.length > 0 && !filters.roles.includes(card.role)) return false;
          if (filters.contractStatus.length > 0 && !filters.contractStatus.includes(card.contractStatus)) return false;
          if (filters.tags.length > 0) {
              const hasTag = card.tags.some(t => filters.tags.includes(t));
              if (!hasTag) return false;
          }
          return true;
      });
  };

  const shouldShowColumn = (column: Column): boolean => {
      if (filters.ngos.length > 0) {
          return filters.ngos.some(ngo => column.title.includes(ngo));
      }
      return true;
  };

  return {
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filters,
    handleFilterChange,
    handleClearFilters,
    availableNgos,
    activeFilterCount,
    filterCards,
    shouldShowColumn,
  };
}
