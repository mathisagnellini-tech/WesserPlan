import type { TeamPlannerFundraiserDto } from '@/types/plan';
import type { Person } from '../types';

/**
 * Adapt a `TeamPlannerFundraiserDto` (page-bundle shape, identifying +
 * performance fields) into the `Person` shape the team-planner views
 * expect. Many `Person` fields aren't covered by the bundle — those are
 * seeded with safe, neutral defaults so the UI renders without fabricating
 * motivational copy or fake medical visits.
 *
 * This is a one-way mapping (backend → UI). Edits to a `Person` in the
 * UI should not be round-tripped through this adapter.
 *
 * The page bundle pre-classifies fundraisers into `active` / `newcomers` /
 * `alumni` so the previous `selectNewcomers` / `selectAlumni` filter helpers
 * are no longer needed — the consumer reads the right list directly.
 */
export function adaptFundraiserToPerson(dto: TeamPlannerFundraiserDto): Person {
  const fullName = `${dto.firstName ?? ''} ${dto.lastName ?? ''}`.trim() || `#${dto.fundraiserNumber}`;

  return {
    id: String(dto.personId),
    name: fullName,
    role: 'Fundraiser',
    age: 0, // Not surfaced by the page bundle; would require Persons/Get for record drilldown.
    origin: dto.teamName ?? '',
    photoUrl: dto.avatar ?? '',
    tags: [],
    email: dto.email ?? '',
    phone: dto.phone ?? '',

    teamtailor: { motivation: '', availability: '' },
    cv: { skills: [], experience: '' },
    hasLicense: false,
    startDate: '',

    contractStatus: 'Signed',
    medicalVisit: false,
    workDates: [],

    // Performance: bundle gives us supporters / volume / weeksWorked.
    // Use them where there's a 1:1 mapping, leave the rest at 0.
    drRate: dto.supporters ?? 0,
    qualityScore: 0,
    regularDonors: dto.supporters ?? 0,
    attritionRate: 0,
    weeksOfExperience: dto.weeksWorked ?? 0,

    trackingHistory: [],

    documents: { cni: '', license: '', badge: '' },
  };
}
