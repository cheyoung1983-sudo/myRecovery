
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
}

export interface AttendanceRecord {
  meetingId: string;
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
