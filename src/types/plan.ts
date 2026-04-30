// Page-bundle DTOs from the new backend Plan API.
//
// These mirror the C# `Get…DataResponseDto` shapes returned by the five
// page-bundle endpoints under `/api/France/Web/Plan/{Page}/Get`. Bundles
// replace the per-domain endpoints we previously wired (donors, fundraisers,
// teamLeaders, deployment) — one HTTP round-trip per page now hydrates every
// widget on that page.
//
// Convention: lowercase first letter for JSON, nullable C# → optional TS.

// ── Dashboard bundle ─────────────────────────────────────────────────

export interface DashboardKpisDto {
  donorsRecruited: number;
  activeFundraisers: number;
  activeTeams: number;
  productivity: number;
  isFallback: boolean;
  resolvedWeek: number;
  resolvedYear: number;
}

export interface DashboardCampaignDto {
  campaignId: string;
  name: string;
}

export interface DashboardClusterAnalyticsDto {
  clusterId: string;
  label: string;
  fundraiserCount: number;
  donorsRecruited: number;
  productivity: number;
  avgDonation: number;
}

export interface DashboardTeamDto {
  teamId: number;
  teamName: string;
  organization: string;
  memberCount: number;
  totalDR: number;
  totalVolume: number;
}

export interface GetDashboardDataResponseDto {
  week: number;
  year: number;
  campaignId: string | null;
  kpis: DashboardKpisDto;
  campaigns: DashboardCampaignDto[];
  clusterAnalytics: DashboardClusterAnalyticsDto[];
  teams: DashboardTeamDto[];
}

// ── Wplan bundle ─────────────────────────────────────────────────────

export interface WplanNationalDto {
  totalSignups: number;
  avgMonthlyDonation: number;
  avgDonorAge: number;
  activeFundraisers: number;
}

export interface WplanByDepartmentDto {
  deptCode: string;
  deptName: string;
  signupCount: number;
  avgMonthlyDonation: number;
  avgAge: number;
}

export interface WplanHourlyConversionDto {
  hour: number;
  signups: number;
  percent: number;
}

export interface WplanAgeDistributionDto {
  bracket: string;
  percent: number;
  count: number;
}

export interface WplanWeeklySeriesDto {
  week: number;
  signups: number;
  avgDonation: number;
}

export interface GetWplanDataResponseDto {
  week: number;
  year: number;
  campaignId: string | null;
  national: WplanNationalDto;
  byDepartment: WplanByDepartmentDto[];
  hourlyConversion: WplanHourlyConversionDto[];
  ageDistribution: WplanAgeDistributionDto[];
  weeklySeries: WplanWeeklySeriesDto[];
}

// ── TeamPlanner bundle ───────────────────────────────────────────────

export interface TeamPlannerFundraiserDto {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fundraiserNumber: string;
  teamName: string;
  isActive: boolean;
  weeksWorked: number;
  avatar: string;
  supporters: number;
  volume: number;
}

export interface TeamPlannerLeaderDto {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  teamId: number;
  teamName: string;
  organization: string;
}

export interface GetTeamPlannerDataResponseDto {
  campaignYear: number;
  totalFundraisers: number;
  /** Currently working — `isActive === true`. */
  active: TeamPlannerFundraiserDto[];
  /** Active AND `weeksWorked <= 2` — still onboarding. */
  newcomers: TeamPlannerFundraiserDto[];
  /** No longer active — `isActive === false`. */
  alumni: TeamPlannerFundraiserDto[];
  teamLeaders: TeamPlannerLeaderDto[];
}

// ── Mairie bundle ────────────────────────────────────────────────────

export interface MairieTeamLeaderDto {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  teamId: number;
  teamName: string;
  organization: string;
}

export interface GetMairieDataResponseDto {
  teamLeaders: MairieTeamLeaderDto[];
}

