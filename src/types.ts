
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
  sponsorId: string;
  lastMessageAt: any; // serverTimestamp or Date
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: any;
}
