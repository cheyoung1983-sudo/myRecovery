/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, ShieldAlert, MapPin, Bus, Heart, 
  Wind, MessageCircle, ChevronRight, X, BadgeCheck,
  Eye, Fingerprint, Volume2, Flower2, Coffee,
  UserCheck, Clock, ShieldCheck, Info, Accessibility,
  ArrowLeft, Send, Search, Menu, Bell, BellOff, Settings2,
  LogOut, LogIn, Mail, Sparkles, Calendar, TrendingUp, Trophy,
  Smile, Frown, Meh, AlertCircle, Check, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { 
  auth, db, googleProvider, OperationType, handleFirestoreError,
  requestForToken, onMessage, messaging
} from './lib/firebase';
import { 
  signInWithPopup, onAuthStateChanged, signOut, User as FirebaseUser,
  sendEmailVerification, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, setDoc, onSnapshot, collection, query, where, orderBy, 
  serverTimestamp, updateDoc, addDoc, getDoc, getDocs, deleteDoc,
  Timestamp, or, increment
} from 'firebase/firestore';

import { Meeting, Sponsor, AttendanceRecord, Message, ChatSession, Resource, UserProfile, MoodEntry } from './types';
import { SPOKANE_NEIGHBORHOODS, RECOVERY_NEEDS, SUPER_ADMIN_EMAIL, SPOKANE_RESOURCES } from './constants';
import { SponsorApplicationForm } from './components/SponsorApplicationForm';
import { AdminDashboard } from './components/AdminDashboard';
import { MeetingReviews } from './components/MeetingReviews';
import { MentorReviews } from './components/MentorReviews';
import { ChatList } from './components/ChatList';
import { AdBanner } from './components/AdBanner';
import { NativeAd } from './components/NativeAd';
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { useRewardedAd } from './hooks/useRewardedAd';

// New Components
import { MeetingBuddyBeacon } from './components/MeetingBuddyBeacon';
import { NeighborhoodFeed } from './components/NeighborhoodFeed';
import { AIReflectionCard } from './components/AIReflectionCard';
import { SOSButton } from './components/SOSButton';
import { TransitArrivals } from './components/TransitArrivals';
import { SpokaneResources } from './components/SpokaneResources';
import { LiteratureSearch } from './components/LiteratureSearch';
import { RecoveryHub } from './components/RecoveryHub';
import { GroundingTool } from './components/GroundingTool';
import { MeetingCard } from './components/MeetingCard';
import { SponsorCard } from './components/SponsorCard';
import { ResourceCard } from './components/ResourceCard';
import { AISupportView } from './components/AISupportView';
import { ChipCase } from './components/ChipCase';
import { MoodLogger } from './components/MoodLogger';
import { MeetingDetailModal } from './components/MeetingDetailModal';
import { WarmHandshakeModal } from './components/WarmHandshakeModal';
import { MeetingMap } from './components/MeetingMap';
import { ChatView } from './components/ChatView';
import { BetaFeedbackModal } from './components/BetaFeedbackModal';

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

// --- MOCK DATA ---
const INITIAL_MEETINGS: any[] = [
  { 
    id: "1", 
    name: "Sunday Morning Serenity", 
    neighborhood: "South Hill", 
    address: "Manito Park, Spokane, WA", 
    time: "10:00 AM", 
    day: "Sunday",
    fellowship: "AA",
    format: "Discussion",
    description: "Outdoor meeting near the duck pond. Bring a chair.",
    isOpen: true,
    sponsors: ["1"],
    lat: 47.6366,
    lng: -117.4116
  },
  { 
    id: "2", 
    name: "North Hill Group", 
    neighborhood: "North Side", 
    address: "North Hill Christian Church", 
    time: "7:00 PM", 
    day: "Tuesday",
    fellowship: "NA",
    format: "Basic Text Study",
    description: "Enter through the side door by the playground.",
    isOpen: false,
    sponsors: ["2"],
    lat: 47.7025,
    lng: -117.4180
  },
  { 
    id: "3", 
    name: "Valley Clean & Serene", 
    neighborhood: "Valley", 
    address: "Spokane Valley Alano Club", 
    time: "6:30 PM", 
    day: "Thursday",
    fellowship: "NA",
    format: "Speaker",
    description: "Large room, plenty of parking.",
    isOpen: true,
    sponsors: ["1", "2"],
    lat: 47.6695,
    lng: -117.2285
  },
  { 
    id: "4", 
    name: "Downtown High Noon", 
    neighborhood: "Downtown", 
    address: "Central United Methodist", 
    time: "12:00 PM", 
    day: "Monday",
    fellowship: "AA",
    format: "Big Book Study",
    description: "Basement meeting room. Quick 1-hour format.",
    isOpen: true,
    sponsors: [],
    lat: 47.6534,
    lng: -117.4187
  },
];

const INITIAL_SPONSORS: any[] = [
  { 
    id: "1", 
    name: "Sarah J.", 
    years: 12, 
    specialties: ["Trauma", "Grief", "Dual-Diagnosis"], 
    bio: "Walking this path since 2012. I specialize in dual-diagnosis recovery and trauma-informed support.",
    neighborhood: "South Hill",
    isVerified: true,
    status: 'verified'
  },
  { 
    id: "2", 
    name: "Michael K.", 
    years: 8, 
    specialties: ["Big Book", "Step Work", "Sponsorship"], 
    bio: "Focusing on the solution. Available for morning check-ins and structured step work.",
    neighborhood: "Valley",
    isVerified: true,
    status: 'verified'
  },
  {
    id: "3",
    name: "James R.",
    years: 10,
    specialties: ["Dual-Diagnosis", "Trauma"],
    bio: "Focuses on dual-diagnosis and trauma recovery.",
    neighborhood: "North Side",
    isVerified: false,
    status: 'pending'
  },
  {
    id: "4",
    name: "David L.",
    years: 5,
    specialties: ["Step Work", "Accountability"],
    bio: "Active in the downtown community. Happy to help newcomers find their footing.",
    neighborhood: "Downtown",
    isVerified: true,
    status: 'verified'
  }
];

// --- MAIN APPLICATION ---



export default function App() {
  const [tab, setTab] = useState<'meetings' | 'sponsors' | 'crisis' | 'profile' | 'admin' | 'apply' | 'chat' | 'resources' | 'hub' | 'ai' | 'literature'>('meetings');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userNeeds, setUserNeeds] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [sobrietyDate, setSobrietyDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');

  useEffect(() => {
    if (userProfile?.neighborhood && selectedNeighborhood === 'All') {
      setSelectedNeighborhood(userProfile.neighborhood);
    }
  }, [userProfile?.neighborhood]);

  useEffect(() => {
    if (!currentUser) {
      setAttendance([]);
      return;
    }

    const q = query(
      collection(db, 'users', currentUser.uid, 'attendance'),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendance(records);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}/attendance`));
  }, [currentUser]);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [reachingOutTo, setReachingOutTo] = useState<Sponsor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNotifications, setAdminNotifications] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [reminders, setReminders] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, type?: 'info' | 'success' | 'alert'}[]>([]);

  const showToast = (text: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [moodLogs, setMoodLogs] = useState<MoodEntry[]>([]);
  const [isGroundingActive, setIsGroundingActive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUserProfiles, setAllUserProfiles] = useState<(UserProfile & { uid: string })[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        if (payload.notification) {
          triggerSystemNotification(
            payload.notification.title || 'New Message',
            payload.notification.body || ''
          );
        }
      });
      return unsubscribe;
    }
  }, []);

  const incompleteProfile = useMemo(() => {
    if (!userProfile) return false;
    return !userProfile.neighborhood || (userProfile.recoveryNeeds || []).length === 0;
  }, [userProfile]);

  const isMentor = useMemo(() => userProfile?.role === 'mentor', [userProfile]);

  const activeChat = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId);
  }, [chatSessions, activeChatId]);

  const activeSponsor = useMemo(() => {
    if (!activeChat) return null;
    return sponsors.find(s => s.id === activeChat.sponsorId);
  }, [activeChat, sponsors]);

  const unreadCount = useMemo(() => {
    return chatSessions.filter(s => {
      if (!currentUser) return false;
      const lastRead = s.lastRead?.[currentUser.uid] || 0;
      const lastMsgAt = s.lastMessageAt instanceof Timestamp ? s.lastMessageAt.toMillis() : s.lastMessageAt;
      return lastMsgAt > lastRead;
    }).length;
  }, [chatSessions, currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          let profile: UserProfile;
          if (!userDoc.exists()) {
            profile = {
              email: user.email || '',
              name: user.displayName || 'Anonymous Player',
              photoURL: user.photoURL || '',
              sobrietyDate: new Date().toISOString().split('T')[0],
              recoveryNeeds: [],
              role: 'user'
            };
            await setDoc(userDocRef, profile);
          } else {
            profile = userDoc.data() as UserProfile;
          }
          setUserProfile(profile);
          setIsSuperAdmin(profile.role === 'admin');
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
        setIsSuperAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'meetings'), orderBy('name', 'asc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Meeting[];
      setMeetings(list.length > 0 ? list : INITIAL_MEETINGS);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'sponsors'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Sponsor[];
      setSponsors(list.length > 0 ? list : INITIAL_SPONSORS);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'), 
      or(where('userId', '==', currentUser.uid), where('mentorUserId', '==', currentUser.uid)),
      orderBy('lastMessageAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setChatSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession)));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'chats', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [activeChatId]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'users', currentUser.uid, 'moodLogs'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setMoodLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as MoodEntry)));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snap) => {
      setAllUserProfiles(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile & { uid: string })));
    });
  }, [isSuperAdmin]);

  const triggerSystemNotification = (title: string, body: string) => {
    showToast(`${title}: ${body}`, "info");
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'auth');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      setResetSent(true);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleResendVerification = async () => {
    if (currentUser) {
      setVerificationLoading(true);
      try {
        await sendEmailVerification(currentUser);
        setVerificationSent(true);
        showToast("Verification email sent!", "success");
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'auth');
      } finally {
        setVerificationLoading(false);
      }
    }
  };

  const checkVerification = async () => {
    if (currentUser) {
      await currentUser.reload();
      setCurrentUser({ ...auth.currentUser! });
    }
  };

  const daysSober = useMemo(() => {
    if (!userProfile?.sobrietyDate) return 0;
    const start = new Date(userProfile.sobrietyDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [userProfile?.sobrietyDate]);

  const handleUpdateSponsor = async (id: string, updates: Partial<Sponsor>) => {
    try {
      await updateDoc(doc(db, 'sponsors', id), updates);
      showToast("Profile Updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `sponsors/${id}`);
    }
  };

  const handleVerifySponsor = async (id: string) => {
    if (!currentUser) return;
    await handleUpdateSponsor(id, { 
      isVerified: true, 
      status: 'verified',
      verifiedAt: serverTimestamp(),
      verifiedBy: currentUser.email || currentUser.uid
    });
  };

  const handleRejectSponsor = async (id: string) => {
    if (!currentUser) return;
    await handleUpdateSponsor(id, { 
      isVerified: false, 
      status: 'rejected',
      verifiedAt: serverTimestamp(),
      verifiedBy: currentUser.email || currentUser.uid
    });
  };

  const toggleEditSpecialty = (spec: string) => {
    setEditSpecialties(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleApplySponsor = async (app: Omit<Sponsor, 'id' | 'isVerified' | 'status' | 'userId'>) => {
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      showToast("Verification required to apply", "alert");
      handleResendVerification();
      return;
    }
    try {
      await addDoc(collection(db, 'sponsors'), {
        ...app,
        userId: currentUser.uid,
        isVerified: false,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setTab('meetings');
      triggerSystemNotification('Application Sent', 'The Spokane Admin team will review your mentor profile shortly.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'sponsors');
    }
  };

  const handleStartChat = async (sponsor: Sponsor, initialText: string) => {
    if (!currentUser) {
      setTab('profile');
      return;
    }

    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('userId', '==', currentUser.uid), where('sponsorId', '==', String(sponsor.id)));
      const snap = await getDocs(q);
      
      let chatId = '';
      if (snap.empty) {
        const newChat = await addDoc(chatsRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Member',
          mentorUserId: sponsor.userId,
          sponsorId: String(sponsor.id),
          sponsorName: sponsor.name,
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        chatId = newChat.id;
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: currentUser.uid,
          text: initialText,
          timestamp: serverTimestamp()
        });
      } else {
        chatId = snap.docs[0].id;
      }
      
      setActiveChatId(chatId);
      setReachingOutTo(null);
      setTab('chat');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'chats');
    }
  };

  const handleLogMood = async (mood: MoodEntry['mood'], note: string) => {
    if (!currentUser) return;
    if (!currentUser.emailVerified) {
      showToast("Verification required to log mood", "alert");
      handleResendVerification();
      return;
    }
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'moodLogs'), {
        userId: currentUser.uid,
        mood,
        note,
        timestamp: serverTimestamp()
      });
      triggerSystemNotification('Mood Logged', 'Stay consistent. You are doing great.');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${currentUser.uid}/moodLogs`);
    }
  };

  const handleUpdateUserRole = async (targetUid: string, newRole: 'user' | 'mentor' | 'admin') => {
    if (!isSuperAdmin) return;
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole
      });
      // Sync Custom Claims via Backend
      await fetch('/api/admin/sync-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: targetUid, role: newRole })
      });
      triggerSystemNotification('Success', `User role and security claims updated to ${newRole}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleEnableNotifications = async () => {
    if (!currentUser) return;
    const token = await requestForToken();
    if (token) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          fcmToken: token,
          notificationsEnabled: true
        });
        setNotificationPermission('granted');
        showToast("Push notifications enabled!", "success");
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    } else {
      showToast("Could not enable notifications. Please check site settings.", "alert");
    }
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        handleEnableNotifications();
      } else if (Notification.permission === 'granted') {
        handleEnableNotifications();
      } else {
        showToast("Notifications are blocked in your browser settings.", "alert");
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChatId || !currentUser) return;
    try {
      const chatRef = doc(db, 'chats', activeChatId);
      await addDoc(collection(chatRef, 'messages'), {
        senderId: currentUser.uid,
        text,
        timestamp: serverTimestamp()
      });
      await updateDoc(chatRef, { 
        lastMessageAt: serverTimestamp(),
        [`lastRead.${currentUser.uid}`]: serverTimestamp(),
        [`typingStatus.${currentUser.uid}`]: false
      });
      showToast("Message sent", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `chats/${activeChatId}/messages`);
    }
  };

  const handleUpdateTyping = async (isTyping: boolean) => {
    if (!activeChatId || !currentUser) return;
    try {
      await updateDoc(doc(db, 'chats', activeChatId), {
        [`typingStatus.${currentUser.uid}`]: isTyping
      });
    } catch (e) {
      // Ignore
    }
  };

  const toggleNeed = async (need: string) => {
    if (!currentUser) return;
    const newNeeds = userNeeds.includes(need) ? userNeeds.filter(n => n !== need) : [...userNeeds, need];
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        recoveryNeeds: newNeeds
      });
      setUserNeeds(newNeeds);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateSobrietyDate = async (date: string) => {
    if (!currentUser) return;
    setSobrietyDate(date);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        sobrietyDate: date
      });
      setUserProfile(prev => prev ? { ...prev, sobrietyDate: date } : prev);
      showToast("Sobriety date updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateNeighborhood = async (neighborhood: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        neighborhood
      });
      setUserProfile(prev => prev ? { ...prev, neighborhood } : prev);
      triggerSystemNotification('Location Updated', `Preferences set to ${neighborhood}. Matching updated.`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : prev);
      showToast("Profile updated!", "success");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleAIMentorMatch = async () => {
    if (!userProfile?.recoveryNeeds || sponsors.length === 0) return;
    showToast("Analyzing community members...", "info");
    try {
      const response = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userNeeds: userProfile.recoveryNeeds, 
          mentors: sponsors.map(s => ({ id: s.id, name: s.name, bio: s.bio, specialties: s.specialties }))
        })
      });
      if (!response.ok) throw new Error('Match failed');
      const data = await response.json();
      
      const matchText = data.match;
      const matchedSponsor = sponsors.find(s => matchText.includes(s.id) || matchText.includes(s.name));
      
      if (matchedSponsor) {
        setReachingOutTo(matchedSponsor);
        showToast(`AI Recommends: ${matchedSponsor.name}`, "success");
      } else {
        triggerSystemNotification("AI Recommendation", matchText);
      }
    } catch (e) {
      showToast("Could not complete matching", "alert");
    }
  };

  const handleLogAttendance = async (meeting: Meeting) => {
    if (!currentUser) {
      showToast("Please sign in to log attendance", "alert");
      return;
    }

    if (!currentUser.emailVerified) {
      showToast("Verification required to log attendance", "alert");
      handleResendVerification();
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const alreadyLogged = attendance.some(a => a.meetingId === meeting.id && a.date === today);
    if (alreadyLogged) {
      showToast("Already logged this meeting today!", "info");
      return;
    }

    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'attendance'), {
        meetingId: meeting.id,
        meetingName: meeting.name,
        date: today,
        timestamp: serverTimestamp()
      });

      // Award Community Points
      if (userProfile && currentUser) {
        const newPoints = (userProfile.points || 0) + 10;
        const newBadges = [...(userProfile.badges || [])];
        
        // Potential badge award
        // Fetch total attendance count to see if they reached 5
        const attendanceSnap = await getDocs(collection(db, 'users', currentUser.uid, 'attendance'));
        if (attendanceSnap.size >= 5 && !newBadges.includes('Meeting Warrior')) {
          newBadges.push('Meeting Warrior');
          showToast("Achievement Unlocked: Meeting Warrior! 🛡️", "success");
        }

        await updateDoc(doc(db, 'users', currentUser.uid), {
          points: increment(10),
          badges: newBadges
        });
        showToast("Logged! +10 Community Points", "success");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/attendance`);
    }
  };

  const topMatches = useMemo(() => {
    if (userNeeds.length === 0) return [];
    return sponsors
      .filter(s => s.status === 'verified')
      .map(s => {
        let score = 0;
        userNeeds.forEach(need => { if (s.specialties.includes(need)) score += 2; });
        if (userProfile?.neighborhood && s.neighborhood === userProfile.neighborhood) score += 3;
        return { sponsor: s, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [sponsors, userNeeds, userProfile?.neighborhood]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
      const matchNeighborhood = selectedNeighborhood === 'All' || m.neighborhood === selectedNeighborhood;
      return matchSearch && matchNeighborhood;
    });
  }, [meetings, searchQuery, selectedNeighborhood]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
      <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-28 font-sans selection:bg-blue-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40">
                <ShieldCheck size={24} className="text-white" />
             </div>
             <div>
                <h1 className="text-xl font-black text-white italic tracking-tighter uppercase">Sober Spokane</h1>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em]">Community Support Network</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentUser && userProfile && <SOSButton userProfile={userProfile} userId={currentUser.uid} />}
            <button className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors relative">
               <Bell size={20} />
               {reminders.length > 0 && <span className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full border border-[#0f172a]" />}
            </button>
            <button onClick={() => setTab('profile')} className="w-11 h-11 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
               {currentUser?.photoURL ? <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{currentUser?.email?.[0].toUpperCase() || '?'}</div>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 pt-8">
        {currentUser && !currentUser.emailVerified && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-600/10 border border-amber-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                <AlertCircle size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white italic uppercase tracking-tight">Verify Your Email</h4>
                <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest mt-0.5">Please check your inbox for the verification link.</p>
              </div>
            </div>
            <button 
              onClick={handleResendVerification}
              disabled={verificationLoading || verificationSent}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20"
            >
              {verificationLoading ? 'Sending...' : verificationSent ? 'Email Sent ✓' : 'Resend Verification'}
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'meetings' && (
            <motion.div key="meetings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Search meetings by name or area..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 p-5 pl-14 rounded-3xl text-sm focus:outline-none focus:border-blue-500 transition-all text-white shadow-inner"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', ...SPOKANE_NEIGHBORHOODS].map(n => (
                      <button 
                        key={n}
                        onClick={() => setSelectedNeighborhood(n)}
                        className={`px-6 py-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${selectedNeighborhood === n ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMeetings.map(m => (
                    <MeetingCard key={m.id} meeting={m} onSelect={setSelectedMeeting} />
                  ))}
                </div>
                {filteredMeetings.length === 0 && (
                  <div className="py-20 text-center space-y-4 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
                     <Search size={48} className="mx-auto text-slate-800" />
                     <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No meetings found in this area.</p>
                  </div>
                )}
              </div>
              <AdBanner />
            </motion.div>
          )}

          {tab === 'hub' && (
            <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <RecoveryHub 
                daysSober={daysSober} 
                moodLogs={moodLogs} 
                onLogMood={handleLogMood}
                userProfile={userProfile}
                topMatches={topMatches}
                onSponsorClick={(s) => { setReachingOutTo(s); setTab('sponsors'); }}
                currentUser={currentUser}
                tab={tab}
                handleAIMentorMatch={handleAIMentorMatch}
              />
            </motion.div>
          )}

          {tab === 'sponsors' && (
            <motion.div key="sponsors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-1">All Verified Sponsors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sponsors.filter(s => s.status === 'verified').map(s => (
                    <SponsorCard key={s.id} sponsor={s} onReachOut={setReachingOutTo} />
                  ))}
                  <NativeAd />
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800/80 p-8 rounded-[2rem] text-center">
                <Heart size={32} className="text-rose-500 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Want to help?</h3>
                <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed uppercase tracking-wider font-bold">Verified sponsors must have 2+ years of continuous recovery.</p>
                <button onClick={() => setTab('apply')} className="text-blue-500 font-black tracking-widest text-[10px] uppercase border border-blue-500/30 px-6 py-2.5 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-black/20">Apply as a Mentor</button>
              </div>
            </motion.div>
          )}

          {tab === 'crisis' && (
            <motion.div key="crisis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <GroundingTool />
              <div className="grid gap-4">
                <a href="tel:18772661818" className="flex items-center justify-between p-7 bg-rose-600 rounded-[2rem] text-white">
                  <div><h3 className="text-xl font-black mb-1">Spokane Regional Crisis</h3><p className="text-rose-100 text-sm">Available 24/7</p></div>
                  <Phone size={32} />
                </a>
              </div>
              <button onClick={() => setTab('meetings')} className="w-full text-slate-500 text-sm font-black uppercase tracking-[0.2em] py-8">Exit Crisis Dashboard</button>
            </motion.div>
          )}

          {tab === 'ai' && <AISupportView currentUser={currentUser} moodLogs={moodLogs} />}

          {tab === 'literature' && (
            <motion.div key="literature" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
               <LiteratureSearch />
            </motion.div>
          )}

          {tab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-6 pb-32"
            >
              <SpokaneResources />
            </motion.div>
          )}

          {tab === 'chat' && (
            <>
              {activeChatId && activeChat ? (
                <ChatView session={activeChat} messages={messages} currentUser={currentUser} onBack={() => setActiveChatId(null)} onSendMessage={handleSendMessage} onTyping={handleUpdateTyping} />
              ) : (
                <ChatList chats={chatSessions.map(c => ({ ...c, sponsor: sponsors.find(s => s.id === c.sponsorId) }))} onSelectChat={(id) => setActiveChatId(id)} currentUserId={currentUser?.uid} />
              )}
            </>
          )}

          {tab === 'apply' && <SponsorApplicationForm onSubmit={handleApplySponsor} onCancel={() => setTab('sponsors')} />}

          {tab === 'admin' && <AdminDashboard pendingSponsors={sponsors.filter(s => s.status === 'pending')} onApprove={handleVerifySponsor} onReject={handleRejectSponsor} allSponsors={sponsors} allUserProfiles={allUserProfiles} onUpdateRole={handleUpdateUserRole} />}

          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="space-y-10">
              {!currentUser ? (
                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                  {resetSent ? (
                    <div className="text-center space-y-6 py-4">
                      <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                        <Mail className="text-blue-500" size={32} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Check Your Inbox</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                          We've sent a link to {email}.<br />Please check your email to continue.
                        </p>
                      </div>
                      <button 
                        onClick={() => { setResetSent(false); setAuthMode('login'); }}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                      >
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tight">{authMode === 'login' ? 'Welcome Back' : 'Join the Network'}</h2>
                      </div>
                      {authError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-[10px] font-bold uppercase text-center">
                          {authError}
                        </div>
                      )}
                      <form onSubmit={authMode === 'login' ? handleEmailLogin : handleSignup} className="space-y-4">
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all" required />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white text-sm focus:border-blue-500 outline-none transition-all" required />
                        {authMode === 'login' && (
                          <button type="button" onClick={handleResetPassword} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-blue-400 block ml-auto px-1">Forgot Password?</button>
                        )}
                        <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95">{authMode === 'login' ? 'Sign In' : 'Sign Up'}</button>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                          <div className="relative flex justify-center text-[8px] uppercase font-black text-slate-700"><span className="bg-slate-900 px-4">OR</span></div>
                        </div>
                        <button type="button" onClick={handleLogin} className="w-full py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                          <LogIn size={18} /> Continue with Google
                        </button>
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all pt-2">
                          {authMode === 'login' ? 'New to Spokane Recovery? Sign Up' : 'Already have an account? Sign In'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/20 rounded-[2rem] border border-slate-800 p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">Community Identity</h3>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Display Alias</label>
                        <input 
                          type="text" 
                          value={userProfile?.alias || ''}
                          onChange={(e) => handleUpdateProfile({ alias: e.target.value })}
                          placeholder={userProfile?.name?.split(' ')[0]}
                          className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-sm text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      {userProfile?.role === 'mentor' && (
                        <div className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
                          <div>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">Emergency Response</p>
                            <p className="text-[9px] text-slate-500 italic">Available for SOS alerts</p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={userProfile?.isCrisisAvailable || false}
                            onChange={(e) => handleUpdateProfile({ isCrisisAvailable: e.target.checked })}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-rose-600 focus:ring-rose-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><MapPin size={14} /> My Neighborhood</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Downtown', 'South Hill', 'North Side', 'Valley', 'West Plains', 'Airway Heights'].map(n => (
                        <button key={n} onClick={() => handleUpdateNeighborhood(n)} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${userProfile?.neighborhood === n ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>{n}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 mb-4 flex items-center gap-2"><Clock size={14} /> Recovery Progress</h3>
                    <input type="date" value={sobrietyDate} onChange={(e) => handleUpdateSobrietyDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-center font-bold text-white shadow-sm" />
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><Bell size={14} /> Notifications</h3>
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">Push Notifications</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">Alerts for messages & meetings</p>
                      </div>
                      <button 
                        onClick={handleRequestPermission}
                        className={`w-14 h-8 rounded-full p-1 transition-all flex ${userProfile?.notificationsEnabled && notificationPermission === 'granted' ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'}`}
                      >
                        <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2"><Calendar size={14} /> My Meeting History ({attendance.length})</h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden divide-y divide-slate-800">
                      {attendance.slice(0, 5).map(record => (
                        <div key={record.id} className="p-5 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-white">{record.meetingName}</h4>
                            <p className="text-[10px] text-slate-500">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                          <div className="px-3 py-1 bg-blue-600/10 rounded-full border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-tighter">+1 Win</div>
                        </div>
                      ))}
                      {attendance.length === 0 && <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase">No meetings logged.</div>}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-800 space-y-4">
                    <button
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="w-full py-5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                    >
                      Give Beta Feedback
                    </button>
                    <button onClick={handleLogout} className="w-full py-5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-950/20">Sign Out</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 py-4 px-6 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-slate-800/80 flex justify-around items-center z-50 shadow-2xl safe-area-bottom">
        {[
          { id: 'meetings', icon: MapPin, label: 'Maps' },
          { id: 'hub', icon: Trophy, label: 'Hub' },
          { id: 'sponsors', icon: UserCheck, label: 'Partners' },
          { id: 'resources', icon: Heart, label: 'Bento' },
          { id: 'literature', icon: BookOpen, label: 'Read' },
          { id: 'ai', icon: Sparkles, label: 'Guide' },
          { id: 'chat', icon: Mail, label: 'Inbox', badge: unreadCount },
          { id: 'profile', icon: Settings2, label: 'More' }
        ].map((n: any) => (
          <button key={n.id} onClick={() => setTab(n.id as any)} className={`flex flex-col items-center gap-1 transition-all relative ${tab === n.id ? (n.color || 'text-blue-500') + ' scale-110' : 'text-slate-500'}`}>
            <n.icon size={22} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{n.label}</span>
            {n.badge > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-[#0f172a]" />}
            {tab === n.id && <motion.div layoutId="nav-dot" className={`absolute -bottom-2 w-1 h-1 rounded-full ${n.color?.replace('text', 'bg') || 'bg-blue-500'}`} />}
          </button>
        ))}
        {isSuperAdmin && <button onClick={() => setTab('admin')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'admin' ? 'text-amber-500 scale-110' : 'text-slate-500'}`}><ShieldCheck size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">Admin</span></button>}
      </nav>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col gap-3">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsGroundingActive(true)} className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 border border-blue-500/30"><Wind size={28} /></motion.button>
      </div>

      <AnimatePresence>
        {isGroundingActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div className="w-full max-w-sm relative">
              <button onClick={() => setIsGroundingActive(false)} className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white"><X size={24} /></button>
              <GroundingTool />
            </div>
          </motion.div>
        )}
        {selectedMeeting && (
          <MeetingDetailModal 
            meeting={selectedMeeting} 
            onClose={() => setSelectedMeeting(null)} 
            sponsors={sponsors} 
            onConnect={setReachingOutTo} 
            reminders={reminders} 
            onToggleReminder={toggleReminder} 
            onLogAttendance={handleLogAttendance} 
            attendance={attendance} 
            userProfile={userProfile}
            userId={currentUser?.uid || ''}
          />
        )}
        {reachingOutTo && (
          <WarmHandshakeModal sponsor={reachingOutTo} onClose={() => setReachingOutTo(null)} onStartChat={(text) => handleStartChat(reachingOutTo, text)} />
        )}
        {currentUser && (
          <BetaFeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
            userId={currentUser.uid}
            userName={userProfile?.name || 'User'}
          />
        )}
        {currentUser && userProfile && incompleteProfile && (
          <ProfileOnboarding
            user={currentUser}
            profile={userProfile}
            onComplete={async () => {
              const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
              setUserProfile(userDoc.data() as UserProfile);
            }}
          />
        )}
      </AnimatePresence>

      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col gap-2 w-full max-w-xs px-6">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div key={n.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${n.type === 'success' ? 'bg-emerald-600/90 border-emerald-500 text-white' : n.type === 'alert' ? 'bg-rose-600/90 border-rose-500 text-white' : 'bg-[#1e293b]/90 border-slate-700 text-slate-100'}`}>
              {n.type === 'success' ? <Check size={18} /> : n.type === 'alert' ? <AlertCircle size={18} /> : <Info size={18} />}
              <span className="text-xs font-bold leading-tight">{n.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
    </APIProvider>
  );
}
