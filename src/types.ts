
export interface Meeting {
  id: string; // Changed to string for Firestore compatibility
  name: string;
  neighborhood: string;
  address: string;
  time: string;
  day: string;
  fellowship: 'AA' | 'NA';
  format?: string;
  description?: string;
  isOpen?: boolean;
  sponsors?: string[]; // IDs of sponsors who attend (strings)
  lat: number;
  lng: number;
}

export interface Sponsor {
  id: string; // Changed to string for Firestore compatibility
  userId: string;
  name: string;
  years: number;
  specialties: string[];
  bio: string;
  neighborhood?: string;
  isVerified: boolean;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: any;
  verifiedBy?: string;
}

export interface AttendanceRecord {
  id?: string;
  meetingId: string;
  meetingName: string;
  date: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  mentorUserId: string; 
  sponsorId: string;
  lastMessageAt: any;
  lastRead?: Record<string, any>;
  typingStatus?: Record<string, boolean>;
  userName?: string;
  mentorName?: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export interface Resource {
  id: string;
  name: string;
  category: 'Detox' | 'Outpatient' | 'Sober Living' | 'Inpatient' | 'Support';
  address: string;
  phone: string;
  website: string;
  description: string;
  neighborhood: string;
}

export interface MentorReview {
  id: string;
  mentorId: string;
  userId: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export interface UserProfile {
  email: string;
  name: string;
  photoURL: string;
  sobrietyDate: string;
  recoveryNeeds: string[];
  neighborhood?: string;
  role: 'user' | 'mentor' | 'admin';
  fcmToken?: string;
  notificationsEnabled?: boolean;
  alias?: string;
  isCrisisAvailable?: boolean;
  emergencyMentorId?: string;
  points?: number;
  badges?: string[];
}

export interface SpokaneResource {
  id: string;
  name: string;
  category: 'health' | 'food' | 'shelter' | 'crisis' | 'legal';
  address?: string;
  phone?: string;
  website?: string;
  description: string;
  tags?: string[];
}

export interface MeetingBuddy {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  userAlias?: string;
  arrivalTime: any;
  status: 'waiting' | 'matched' | 'completed';
}

export interface NeighborhoodAnnouncement {
  id: string;
  neighborhood: string;
  content: string;
  createdAt: any;
  type: 'event' | 'update' | 'alert';
  authorId: string;
}

export interface NeighborhoodPost {
  id: string;
  neighborhood: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  supportCount: number;
  isNewcomer?: boolean;
}

export interface AIReflection {
  id: string;
  userId: string;
  reflection: string;
  generatedAt: any;
  moodDataSummary?: string;
}

export interface TransitArrival {
  id: string;
  tripId: string;
  routeId: string;
  stopTimeUpdates: {
    stopId: string;
    arrival?: number;
    departure?: number;
    delay?: number;
  }[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'great' | 'good' | 'okay' | 'struggling' | 'crisis';
  note: string;
  timestamp: any;
}

export interface Milestone {
  id: string;
  label: string;
  days: number;
  unlockedAt?: any;
}
