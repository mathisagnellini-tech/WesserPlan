import TeamPlannerApp from '@/components/team-planner/TeamPlannerApp';

export default function TeamPlannerPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-hidden relative">
      <main className="h-screen overflow-y-auto">
        <div className="h-full">
          <TeamPlannerApp />
        </div>
      </main>
    </div>
  );
}
