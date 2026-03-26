
import React, { useState } from 'react';
import { BoardData, Person, Relationship } from '../types';

interface UseTeamRelationshipsParams {
  currentData: BoardData;
  currentWeekIndex: number;
  weeksData: Record<number, BoardData>;
  selectedPerson: Person | null;
  history: { past: BoardData[], future: BoardData[] };
  addToHistory: (newData: BoardData, action: string) => void;
  setActionLog: React.Dispatch<React.SetStateAction<string[]>>;
  setDraggingCardId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useTeamRelationships({
  currentData,
  currentWeekIndex,
  weeksData,
  selectedPerson,
  history,
  addToHistory,
  setActionLog,
  setDraggingCardId,
}: UseTeamRelationshipsParams) {
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [showRelationships, setShowRelationships] = useState<boolean>(false);
  const [relationshipCreation, setRelationshipCreation] = useState<{sourceId: string, targetId: string} | null>(null);

  const handleCardClickForLinking = (person: Person): boolean => {
      if (!isLinkingMode) return false;

      if (linkSourceId === null) {
          setLinkSourceId(person.id);
          setActionLog(prev => [`Source de liaison: ${person.name}`, ...prev]);
      } else if (linkSourceId === person.id) {
          setLinkSourceId(null);
      } else {
          setRelationshipCreation({ sourceId: linkSourceId, targetId: person.id });
          setLinkSourceId(null);
      }
      return true;
  };

  const handleLink = (targetId: string, draggingCardId: string | null) => {
      if (!draggingCardId || draggingCardId === targetId) return;

      const existingRel = currentData.relationships.find(r =>
          (r.sourceId === draggingCardId && r.targetId === targetId) ||
          (r.sourceId === targetId && r.targetId === draggingCardId)
      );

      if (existingRel) {
          alert('Une relation existe déjà entre ces personnes.');
          return;
      }

      setRelationshipCreation({ sourceId: draggingCardId, targetId });
  };

  const confirmRelationship = (type: 'affinity' | 'conflict' | 'synergy') => {
      if (!relationshipCreation) return;

      const newRel: Relationship = {
          id: `rel-${Date.now()}`,
          sourceId: relationshipCreation.sourceId,
          targetId: relationshipCreation.targetId,
          type
      };

      const newData = {
          ...currentData,
          relationships: [...currentData.relationships, newRel]
      };

      addToHistory(newData, `Nouvelle relation: ${type}`);
      setRelationshipCreation(null);
      setDraggingCardId(null);
  };

  const handleAddRelationship = (targetId: string, type: 'affinity' | 'conflict' | 'synergy') => {
      if (!selectedPerson) return;

      const newRel: Relationship = {
          id: `rel-${Date.now()}`,
          sourceId: selectedPerson.id,
          targetId: targetId,
          type
      };

      const newData = {
          ...currentData,
          relationships: [...currentData.relationships, newRel]
      };

      addToHistory(newData, `Relation ajoutée: ${type} entre ${selectedPerson.name} et ${currentData.cards[targetId]?.name}`);
  };

  const handleRemoveRelationship = (relId: string) => {
      const newData = {
          ...currentData,
          relationships: currentData.relationships.filter(r => r.id !== relId)
      };

      addToHistory(newData, `Relation supprimée`);
  };

  const handleAutoSynergy = () => {
      let newRels: Relationship[] = [];
      const existingRelKeys = new Set(currentData.relationships.map(r =>
          [r.sourceId, r.targetId].sort().join('-')
      ));

      Object.values(currentData.columns).forEach((col: any) => {
          const members = col.cardIds.map((id: string) => currentData.cards[id]);

          for (let i = 0; i < members.length; i++) {
              for (let j = i + 1; j < members.length; j++) {
                  const p1 = members[i];
                  const p2 = members[j];
                  const key = [p1.id, p2.id].sort().join('-');

                  if (!existingRelKeys.has(key)) {
                      const p1KnowsP2 = p1.pastTeammates?.includes(p2.id);
                      const p2KnowsP1 = p2.pastTeammates?.includes(p1.id);

                      if (p1KnowsP2 || p2KnowsP1) {
                          newRels.push({
                              id: `auto-rel-${Date.now()}-${i}-${j}`,
                              sourceId: p1.id,
                              targetId: p2.id,
                              type: 'synergy'
                          });
                          existingRelKeys.add(key);
                      }
                  }
              }
          }
      });

      if (newRels.length > 0) {
          const newData = {
              ...currentData,
              relationships: [...currentData.relationships, ...newRels]
          };

          addToHistory(newData, `Auto-Synergie: ${newRels.length} relations créées`);
          alert(`${newRels.length} synergies détectées et créées automatiquement !`);
      } else {
          alert("Aucune nouvelle synergie détectée basées sur l'historique.");
      }
  };

  return {
    isLinkingMode,
    setIsLinkingMode,
    linkSourceId,
    setLinkSourceId,
    showRelationships,
    setShowRelationships,
    relationshipCreation,
    setRelationshipCreation,
    handleCardClickForLinking,
    handleLink,
    confirmRelationship,
    handleAddRelationship,
    handleRemoveRelationship,
    handleAutoSynergy,
  };
}
