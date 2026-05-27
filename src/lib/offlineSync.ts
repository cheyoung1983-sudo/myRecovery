import { collection, addDoc, doc, updateDoc, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const DB_NAME = 'SoberSpokaneOfflineDB';
const DB_VERSION = 1;

export interface OfflineMoodLog {
  id?: string;
  userId: string;
  mood: string;
  note: string;
  timestamp: number;
}

export interface OfflineAttendance {
  id?: string;
  userId: string;
  meetingId: string;
  meetingName: string;
  date: string;
  timestamp: number;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('pendingMoodLogs')) {
        database.createObjectStore('pendingMoodLogs', { keyPath: 'id', autoIncrement: true });
      }
      if (!database.objectStoreNames.contains('pendingAttendance')) {
        database.createObjectStore('pendingAttendance', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Save offline Mood
export async function saveOfflineMood(userId: string, mood: string, note: string): Promise<OfflineMoodLog> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingMoodLogs', 'readwrite');
    const store = transaction.objectStore('pendingMoodLogs');
    const entry: OfflineMoodLog = {
      userId,
      mood,
      note,
      timestamp: Date.now()
    };
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve({ ...entry, id: String(request.result) });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Get offline Mood logs matching userId
export async function getOfflineMoods(userId: string): Promise<OfflineMoodLog[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingMoodLogs', 'readonly');
    const store = transaction.objectStore('pendingMoodLogs');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result || []) as any[];
      const transformed = results.map(item => ({ ...item, id: String(item.id) }));
      resolve(transformed.filter((item: OfflineMoodLog) => item.userId === userId));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Delete offline Mood log
export async function deleteOfflineMood(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingMoodLogs', 'readwrite');
    const store = transaction.objectStore('pendingMoodLogs');
    const request = store.delete(Number(id));

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Save offline Attendance
export async function saveOfflineAttendance(
  userId: string,
  meetingId: string,
  meetingName: string,
  date: string
): Promise<OfflineAttendance> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingAttendance', 'readwrite');
    const store = transaction.objectStore('pendingAttendance');
    const entry: OfflineAttendance = {
      userId,
      meetingId,
      meetingName,
      date,
      timestamp: Date.now()
    };
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve({ ...entry, id: String(request.result) });
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Get offline Attendance records matching userId
export async function getOfflineAttendance(userId: string): Promise<OfflineAttendance[]> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingAttendance', 'readonly');
    const store = transaction.objectStore('pendingAttendance');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result || []) as any[];
      const transformed = results.map(item => ({ ...item, id: String(item.id) }));
      resolve(transformed.filter((item: OfflineAttendance) => item.userId === userId));
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Delete offline Attendance
export async function deleteOfflineAttendance(id: string): Promise<void> {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('pendingAttendance', 'readwrite');
    const store = transaction.objectStore('pendingAttendance');
    const request = store.delete(Number(id));

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Flush pending offline data to Firestore
export async function flushOfflineData(
  userId: string,
  userProfile: any,
  onProgress?: (message: string, type: 'success' | 'info' | 'alert') => void
): Promise<{ moodsSynced: number; attendanceSynced: number }> {
  try {
    const moods = await getOfflineMoods(userId);
    const attendances = await getOfflineAttendance(userId);

    if (moods.length === 0 && attendances.length === 0) {
      return { moodsSynced: 0, attendanceSynced: 0 };
    }

    if (onProgress) {
      onProgress(`Syncing offline records... Found ${moods.length} moods and ${attendances.length} meetings.`, 'info');
    }

    let moodsSynced = 0;
    let attendanceSynced = 0;
    let newPointsAwarded = 0;

    // 1. Sync Mood Logs
    for (const mood of moods) {
      if (mood.id !== undefined) {
        try {
          await addDoc(collection(db, 'users', userId, 'moodLogs'), {
            userId: mood.userId,
            mood: mood.mood,
            note: mood.note,
            timestamp: serverTimestamp()
          });
          await deleteOfflineMood(mood.id);
          moodsSynced++;
        } catch (err) {
          console.error(`Failed to flush mood ${mood.id}:`, err);
        }
      }
    }

    if (moodsSynced > 0 && onProgress) {
      onProgress(`Successfully synced ${moodsSynced} offline mood logs to cloud!`, 'success');
    }

    // 2. Sync Attendance Records
    for (const att of attendances) {
      if (att.id !== undefined) {
        try {
          await addDoc(collection(db, 'users', userId, 'attendance'), {
            meetingId: att.meetingId,
            meetingName: att.meetingName,
            date: att.date,
            timestamp: serverTimestamp()
          });
          await deleteOfflineAttendance(att.id);
          attendanceSynced++;
          newPointsAwarded += 10;
        } catch (err) {
          console.error(`Failed to flush attendance ${att.id}:`, err);
        }
      }
    }

    if (attendanceSynced > 0) {
      // Award Community Points & badges if profile exists
      if (userProfile) {
        try {
          const attendanceSnap = await getDocs(collection(db, 'users', userId, 'attendance'));
          const hasWarrior = userProfile.badges?.includes('Meeting Warrior');
          const finalBadges = [...(userProfile.badges || [])];
          
          if (attendanceSnap.size >= 5 && !hasWarrior) {
            finalBadges.push('Meeting Warrior');
            if (onProgress) {
              onProgress('Achievement Unlocked: Meeting Warrior! 🛡️', 'success');
            }
          }

          await updateDoc(doc(db, 'users', userId), {
            points: increment(newPointsAwarded),
            badges: finalBadges
          });

          if (onProgress) {
            onProgress(`Successfully synced ${attendanceSynced} offline meetings. Awarded +${newPointsAwarded} Community Points!`, 'success');
          }
        } catch (err) {
          console.error('Failed to update points during offline flush:', err);
        }
      }
    }

    return { moodsSynced, attendanceSynced };
  } catch (err) {
    console.warn('Offline sync failed, will retry later:', err);
    return { moodsSynced: 0, attendanceSynced: 0 };
  }
}
