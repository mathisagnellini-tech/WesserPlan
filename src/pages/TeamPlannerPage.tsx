import { useEffect } from 'react';
import TeamPlannerApp from '@/components/team-planner/TeamPlannerApp';

export default function TeamPlannerPage() {
  useEffect(() => {
    document.title = 'Team Planner · Wesser Plan';
  }, []);

  return (
    <div className="h-screen bg-[var(--bg-main)] overflow-hidden">
      <TeamPlannerApp />
    </div>
  );
}
