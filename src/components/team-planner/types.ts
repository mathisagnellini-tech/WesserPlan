
export interface TeamTailorData {
  motivation: string;
  availability: string;
}

export interface CvData {
  skills: string[];
  experience: string;
}

export interface TrackingEntry {
  date: string;
  type: 'call' | 'meeting' | 'email' | 'note';
  summary: string;
  author: string;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  age: number;
  origin: string;
  photoUrl: string;
  tags: string[];
  bio?: string;
  
  // Contact Info
  email: string;
  phone: string;

  // HR & KPIs
  teamtailor: TeamTailorData;
  cv: CvData;
  hasLicense: boolean;
  startDate: string;
  isWarning?: boolean;
  
  // New HR Fields
  contractStatus: 'Signed' | 'Pending' | 'Not Sent';
  medicalVisit: boolean;
  workDates: string[]; // List of worked dates
  
  // Performance Metrics
  drRate: number;
  previousDrRate?: number; // New: For weekly trend
  objective?: number; // New: For context
  weeksOfExperience?: number; // New: For seniority border color
  qualityScore: number;
  regularDonors: number;
  attritionRate: number;
  
  // CRM / Tracking
  trackingHistory: TrackingEntry[];

  // Alerts
  alertType?: 'absent' | 'performance' | 'admin' | 'medical'; // New: Explicit alert types
  isNewArrival?: boolean; // New: To highlight newly added members from the Dynamic Island
  hasWorkedWithNgo?: boolean; // New: To track if they have prior experience with the NGO

  // Secure Documents (Mock URLs)
  documents: {
      cni: string;
      license: string;
      badge: string;
  };

  // ALUMNI SPECIFIC FIELDS
  isAlumni?: boolean;
  alumniCategory?: 'Student' | 'Other';
  lastContact?: string; // ISO Date or formatted string
  returnDate?: string; // "Été 2025", "Indéterminé", etc.

  // SYNERGY & HISTORY
  pastTeammates?: string[]; // IDs of people they have worked with
  
  // PRIVATE NOTES (New Feature)
  privateNotes?: PrivateNote[];

  // PLANNING & AVAILABILITY
  planningHistory?: WeekStatus[];
  nextAvailability?: string;
}

export interface WeekStatus {
    weekNumber: number;
    label: string; // e.g., "Semaine 3"
    dateRange: string; // e.g., "13 - 19 Jan"
    status: 'worked' | 'rest' | 'available' | 'planned';
    location?: string;
}

export interface PrivateNote {
    id: string;
    date: string;
    author: string;
    content: string;
    type: 'feedback' | 'incident' | 'note' | 'conversation';
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'conflict' | 'affinity' | 'synergy';
}

// --- Mission Logistics Types ---
export interface CarDetails {
    model: string;
    plate: string;
    image: string;
    fuelLevel: number; // 0-100
    mileage: number;
    status: 'ok' | 'service_needed' | 'issue';
}

export interface HousingDetails {
    address: string;
    type: 'Gîte' | 'Airbnb' | 'Hôtel' | 'Appartement';
    accessCode?: string;
    wifiDetails?: string;
    image: string;
    checkIn: string;
    checkOut: string;
    rating: number;
}

export interface ZoneDetails {
    name: string;
    mapImage: string;
    weather: {
        temp: number;
        condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
        wind: number;
    }
}

export interface Column {
  id: string;
  title: string;
  capacity: string;
  color: string;
  cardIds: string[];
  isExpanded?: boolean;
  // Mission Logic
  missionData?: {
      car: CarDetails;
      housing: HousingDetails;
      zone: ZoneDetails;
  };
}

export interface BoardData {
  columns: Record<string, Column>;
  cards: Record<string, Person>;
  columnOrder: string[];
  relationships: Relationship[];
}

export interface FilterState {
    roles: string[];
    contractStatus: string[];
    tags: string[];
    ngos: string[];
}
