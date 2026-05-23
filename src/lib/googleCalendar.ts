import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
import { Meeting } from '../types';

let cachedAccessToken: string | null = null;

export const isCalendarConnected = (): boolean => {
  return cachedAccessToken !== null;
};

export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

export const clearCachedToken = (): void => {
  cachedAccessToken = null;
};

export const setCachedToken = (token: string): void => {
  cachedAccessToken = token;
};

export const connectGoogleCalendar = async (): Promise<string> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/tasks');
    provider.addScope('https://www.googleapis.com/auth/chat');
    provider.addScope('https://www.googleapis.com/auth/forms');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential && credential.accessToken) {
      cachedAccessToken = credential.accessToken;
      return credential.accessToken;
    }
    throw new Error('No access token returned from Google Auth');
  } catch (error) {
    console.error('Error connecting Google Calendar:', error);
    throw error;
  }
};

/**
 * Calculates start and end Date for the next occurrence of a meeting's weekly schedule.
 */
export function getNextOccurrence(dayOfWeek: string, timeStr: string): { start: Date; end: Date } {
  const daysMap: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
  };
  
  const targetDay = daysMap[dayOfWeek.toLowerCase().trim()];
  const now = new Date();

  // Parse Time Str (such as "7:30 PM", "12:00 PM", "8:00 AM", "6:00 PM")
  const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  let hours = 12;
  let minutes = 0;
  
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    // Simple numeric cleanup
    const cleanTime = timeStr.replace(/[^0-9:]/g, '');
    const parts = cleanTime.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10) || 12;
      minutes = parseInt(parts[1], 10) || 0;
      if (timeStr.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
      } else if (timeStr.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
      }
    }
  }

  if (targetDay === undefined) {
    // If invalid day, schedule for tomorrow at the same time
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes, 0, 0);
    return { start: targetDate, end: new Date(targetDate.getTime() + 60 * 60 * 1000) };
  }

  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDay = now.getDay();
  let daysDiff = targetDay - currentDay;
  
  if (daysDiff < 0) {
    daysDiff += 7;
  } else if (daysDiff === 0) {
    const proposedTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    if (now.getTime() > proposedTime.getTime()) {
      daysDiff = 7; // Already passed today, schedule next week
    }
  }

  targetDate.setDate(now.getDate() + daysDiff);
  targetDate.setHours(hours, minutes, 0, 0);

  const start = targetDate;
  const end = new Date(targetDate.getTime() + 60 * 60 * 1000); // 1-hour duration

  return { start, end };
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export const fetchCalendarEvents = async (
  token: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearCachedToken();
      throw new Error('Google connection expired. Please reconnect.');
    }
    throw new Error('Failed to retrieve calendar events');
  }

  const data = await response.json();
  return (data.items || []) as CalendarEvent[];
};

export const checkTimeConflict = async (
  token: string,
  start: Date,
  end: Date
): Promise<CalendarEvent | null> => {
  try {
    // Look a bit wider on that day to find partial overlaps
    const startWindow = new Date(start.getTime() - 5 * 60 * 1000);
    const endWindow = new Date(end.getTime() + 5 * 60 * 1000);
    
    const events = await fetchCalendarEvents(token, startWindow, endWindow);
    
    for (const event of events) {
      const evStartStr = event.start.dateTime || event.start.date;
      const evEndStr = event.end.dateTime || event.end.date;
      if (!evStartStr || !evEndStr) continue;

      const evStart = new Date(evStartStr);
      const evEnd = new Date(evEndStr);

      // Simple overlap logic: (StartA < EndB) and (EndA > StartB)
      if (start.getTime() < evEnd.getTime() && end.getTime() > evStart.getTime()) {
        return event;
      }
    }
    return null;
  } catch (error) {
    console.warn('Error checking time conflict:', error);
    return null;
  }
};

export const addMeetingToCalendar = async (
  token: string,
  meeting: Meeting,
  start: Date,
  end: Date
): Promise<any> => {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  
  const eventBody = {
    summary: `myRecovery: ${meeting.fellowship} - ${meeting.name}`,
    location: meeting.address,
    description: meeting.description || `Weekly ${meeting.fellowship} recovery meeting in Spokane, WA (${meeting.neighborhood} neighborhood).\n\nDetails:\nFormat: ${meeting.format || 'Discussion'}\nAccess: ${meeting.isOpen ? 'Open (all welcome)' : 'Closed (addicts/alcoholics only)'}\n\nSynced with myRecovery Companion app.`,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearCachedToken();
      throw new Error('Google connection expired. Please reconnect.');
    }
    const errText = await response.text();
    console.error('Failed to create calendar event:', errText);
    throw new Error('Failed to create calendar event');
  }

  return response.json();
};
