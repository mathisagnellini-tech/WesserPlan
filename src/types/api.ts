// Backend DTO types — mirrors C# DTOs from Wesser.Ign8

// ── Teams ──

export interface TeamListItemDto {
  teamId: number;
  teamName: string;
  organization: string;
  memberCount: number;
  totalDR: number;
  totalVolume: number;
  campaignYear: number;
  calendarWeek: number;
}

export interface TeamLeaderItemDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  team: TeamLeaderTeamDto;
}

export interface TeamLeaderTeamDto {
  id: number;
  name: string;
  organization: string;
  memberCount: number;
}

export interface TeamStatsDto {
  teamId: string;
  teamName: string;
  organization: string;
  teamLeader: TeamLeaderDto;
  weekNumber: string;
  weekStartDate: string;
  weekEndDate: string;
  summary: TeamStatsSummaryDto;
  dailyData: TeamStatsDailyDataDto[];
  teamMembers: TeamMemberStatsDto[];
}

export interface TeamLeaderDto {
  personId: string;
  name: string;
  avatar?: string;
}

export interface TeamStatsSummaryDto {
  totalDR: number;
  totalVolume: number;
}

export interface TeamStatsDailyDataDto {
  day: string;
  date: string;
  dr: number;
  volume: number;
  teamMembersCount: number;
}

export interface TeamMemberStatsDto {
  personId: string;
  name: string;
  role: string;
  avatar?: string;
  level: number;
  dr: number;
  volume: number;
}

export interface TeamsOverviewResponseDto {
  items: TeamOverviewDto[];
}

export interface TeamOverviewDto {
  teamName: string;
  metrics: TeamsOverviewMetricsDto;
}

export interface TeamsOverviewMetricsDto {
  totalSupporters: number;
  totalVolume: number;
  fundraiserCount: number;
}

// ── Dashboard ──

export interface GetDashboardWeeklyPerformanceResponseDto {
  data: WeeklyMetricDto[];
  meta: WeeklyPerformanceMetaDto;
}

export interface WeeklyMetricDto {
  week: string;
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  campaignId: string;
  name: string;
  donorsRecruited: number;
  productivity: number;
  avgMonthlyDonation: number;
  avgDonorAge: number;
  activeFundraisers: number;
  activeTeams: number;
  newcomers: number;
  totalDailyRevenue: number;
}

export interface WeeklyPerformanceMetaDto {
  totalWeeks: number;
  startWeek: string;
  endWeek: string;
  filtersApplied: { campaignId?: string; year: number };
}

export interface GetDashboardCampaignsResponseDto {
  data: CampaignMetricsDto[];
  totalsWeek: CampaignTotalsWeekDto;
  totalsYtd: CampaignTotalsYtdDto;
}

export interface CampaignMetricsDto {
  campaignId: string;
  name: string;
  week: { activeTeams: number; activeFundraisers: number; donors: number; avgProductivity: number };
  ytd: { donors: number; avgDonation: number; avgDonorAge: number };
}

export interface CampaignTotalsWeekDto {
  totalTeams: number;
  totalFundraisers: number;
  totalDonors: number;
  avgProductivity: number;
}

export interface CampaignTotalsYtdDto {
  totalDonors: number;
  avgDonation: number;
  avgDonorAge: number;
}

// ── Cluster analytics (used for tenure-bucketed active fundraisers) ──
// Loose typing: backend shape may evolve; we only consume `fundraiserSplit`.
export interface ClusterAnalyticsResponseDto {
  data: ClusterAnalyticsWeekDto[];
}

export interface ClusterAnalyticsWeekDto {
  week?: string;
  weekNumber?: number;
  year?: number;
  fundraiserSplit?: { w1?: number; w2To4?: number; w5Plus?: number };
  [key: string]: unknown;
}

// ── Users ──

export interface MyFundraiserUserDto {
  id?: number;
  azUserObjectId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fundraiserNumber: number;
}

// ── Organizations ──

export interface OrganizationDto {
  id: number;
  name?: string;
  short?: string;
  organizationNo?: string;
  ident?: string;
}

// ── Fundraiser / Kanban ──

export interface FundraisersKanbanResponseDto {
  success: boolean;
  data: FundraisersKanbanDataDto;
  timestamp: string;
}

export interface FundraisersKanbanDataDto {
  fundraisers: FundraiserKanbanDto[];
  pagination: PaginationDto;
}

export interface FundraiserKanbanDto {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fundraiserNumber: string;
  teamName: string;
  whenCreated: string;
  isActive: boolean;
  performance: PerformanceDto;
  avatar: string;
}

export interface PerformanceDto {
  supporters: number;
  volume: number;
  weeksWorked: number;
}

export interface PaginationDto {
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

// ── Donors / Partner overview (Plan API) ──

export interface PartnerKpisDto {
  totalPARecruited: number;
  avgMonthlyDonation: number;
  avgDonorAge: number;
}

export interface MonthlyPADto {
  month: string;
  count: number;
}

export interface PeriodBreakdownDto {
  period: string;
  count: number;
  avgMonthlyDonation: number;
}

export interface RegionSummaryDto {
  regionCode: string;
  regionName: string;
  count: number;
  avgMonthlyDonation: number;
}

export interface AgeDistributionDto {
  bucket: string;
  count: number;
}

export interface GetPartnerOverviewResponseDto {
  kpis: PartnerKpisDto;
  monthlyPA: MonthlyPADto[];
  periodBreakdown: PeriodBreakdownDto[];
  regionSummary: RegionSummaryDto[];
  ageDistribution: AgeDistributionDto[];
}

export interface DonorPerDepartmentDto {
  deptCode: string;
  deptName: string;
  signupCount: number;
  avgMonthlyDonation: number;
  avgAge: number;
}

export interface DonorHourlyConversionDto {
  hour: number;
  signups: number;
  percent: number;
}

// ── Deployment ──

export interface CityMarkerDto {
  cityName: string;
  inseeCode?: string;
  lat: number;
  lng: number;
  signupCount: number;
  teamCount?: number;
}

export interface RegionDetailDto {
  regionCode: string;
  regionName: string;
  signupCount: number;
  cityCount: number;
  teamCount: number;
}

export interface DeploymentCitiesResponseDto {
  cityMarkers: CityMarkerDto[];
  regions: RegionDetailDto[];
}
