import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, MessageSquare, FileText, Plus, Send, Check, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle, Share2, Clipboard, 
  AlertTriangle, Heart, Calendar, ArrowRight, Mail, Users, Video, Grid, HardDrive,
  FolderOpen, Presentation, X, Globe, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getCachedToken, connectGoogleCalendar } from '../lib/googleCalendar';

interface WorkspaceIntegrationsProps {
  daysSober: number;
  userName: string;
}

export const WorkspaceIntegrations: React.FC<WorkspaceIntegrationsProps> = ({ daysSober, userName }) => {
  const [token, setToken] = useState<string | null>(getCachedToken());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Active Integration Navigation Tab
  const [activeTab, setActiveTab] = useState<'daily' | 'forms' | 'drive' | 'gmail' | 'sheets' | 'meet' | 'slides'>('daily');

  // Google Slides States
  const [presentationId, setPresentationId] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [presentationsList, setPresentationsList] = useState<any[]>([]);

  // Google Picker Modal States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerFilter, setPickerFilter] = useState<'all' | 'slides' | 'docs' | 'sheets' | 'forms'>('all');
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerFiles, setPickerFiles] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [selectedPickedFile, setSelectedPickedFile] = useState<any | null>(null);

  // Google Tasks State
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);

  // Google Chat State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [simulatorMessages, setSimulatorMessages] = useState<any[]>([
    {
      id: 'init-1',
      sender: 'Sponsor Sarah',
      message: 'Welcome to your recovery group chat space! This space handles status updates and notifications in real-time.',
      timestamp: 'Yesterday at 4:32 PM',
      avatar: '👩',
      likes: 2
    },
    {
      id: 'init-2',
      sender: 'Support Companion',
      message: 'You can broadcast daily templates or SOS messages directly from this dashboard anytime.',
      timestamp: 'Today at 7:15 AM',
      avatar: '🤖',
      likes: 1
    }
  ]);
  const [isSetupTourOpen, setIsSetupTourOpen] = useState(false);
  
  // Google Forms State
  const [generatedFormId, setGeneratedFormId] = useState<string>('');
  const [generatedFormUrl, setGeneratedFormUrl] = useState<string>('');
  const [formsLoading, setFormsLoading] = useState(false);
  const [formResponses, setFormResponses] = useState<any[]>([]);
  const [selectedFormTemplate, setSelectedFormTemplate] = useState<'general' | 'sponsor' | 'meeting'>('general');
  const [formAnalysis, setFormAnalysis] = useState<string>('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Google Drive & Docs (Journaling) States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [journalDocId, setJournalDocId] = useState('');
  const [journalDocUrl, setJournalDocUrl] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journalLoading, setJournalLoading] = useState(false);

  // Google Sheets (Moodle/Activity logs) States
  const [sheetId, setSheetId] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetNote, setSheetNote] = useState('');
  const [sheetSoberDays, setSheetSoberDays] = useState(daysSober);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Gmail & Contacts States
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [gmailSubject, setGmailSubject] = useState(`Sobriety Milestone Update! 🎉 (${daysSober} Days)`);
  const [gmailMessage, setGmailMessage] = useState(`I wanted to share that I have reached ${daysSober} Days of clean and sober living today with the help of the Spokane Recovery Network Companion. Thank you for always supporting me!`);
  const [gmailLoading, setGmailLoading] = useState(false);

  // Google Meet States
  const [meetLink, setMeetLink] = useState('');
  const [meetLoading, setMeetLoading] = useState(false);

  // Check auth state
  useEffect(() => {
    const checkAuth = () => {
      const activeToken = getCachedToken();
      setToken(activeToken);
      if (activeToken) {
        loadTasksAndSpaces(activeToken);
      }
    };
    checkAuth();

    // Listen to custom calendar-auth-changed event
    window.addEventListener('calendar-auth-changed', checkAuth);
    return () => {
      window.removeEventListener('calendar-auth-changed', checkAuth);
    };
  }, []);

  // Save/retrieve configurations of list details and form IDs in localStorage
  useEffect(() => {
    const savedList = localStorage.getItem('myrecovery_saved_list_id');
    if (savedList) setSelectedListId(savedList);

    const savedSpace = localStorage.getItem('myrecovery_saved_space_id');
    if (savedSpace) setSelectedSpaceId(savedSpace);

    const savedFormId = localStorage.getItem('myrecovery_saved_form_id');
    const savedFormUrl = localStorage.getItem('myrecovery_saved_form_url');
    const savedTemplate = localStorage.getItem('myrecovery_saved_form_template');
    if (savedFormId) setGeneratedFormId(savedFormId);
    if (savedFormUrl) setGeneratedFormUrl(savedFormUrl);
    if (savedTemplate) setSelectedFormTemplate(savedTemplate as any);

    const savedSlidesId = localStorage.getItem('myrecovery_saved_slides_id');
    const savedSlidesUrl = localStorage.getItem('myrecovery_saved_slides_url');
    if (savedSlidesId) setPresentationId(savedSlidesId);
    if (savedSlidesUrl) setPresentationUrl(savedSlidesUrl);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const activeToken = await connectGoogleCalendar();
      setToken(activeToken);
      window.dispatchEvent(new Event('calendar-auth-changed'));
      await loadTasksAndSpaces(activeToken);
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasksAndSpaces = async (activeToken: string) => {
    fetchTaskLists(activeToken);
    fetchChatSpaces(activeToken);
    fetchDriveFiles(activeToken);
    fetchContacts(activeToken);
    fetchPresentations(activeToken);

    const savedJournalId = localStorage.getItem('myrecovery_saved_journal_id');
    const savedJournalUrl = localStorage.getItem('myrecovery_saved_journal_url');
    if (savedJournalId && savedJournalUrl) {
      setJournalDocId(savedJournalId);
      setJournalDocUrl(savedJournalUrl);
    } else {
      findOrCreateJournal(activeToken, false);
    }

    const savedSheetId = localStorage.getItem('myrecovery_saved_sheet_id');
    const savedSheetUrl = localStorage.getItem('myrecovery_saved_sheet_url');
    if (savedSheetId && savedSheetUrl) {
      setSheetId(savedSheetId);
      setSheetUrl(savedSheetUrl);
    } else {
      findOrCreateSheet(activeToken, false);
    }

    const savedFormId = localStorage.getItem('myrecovery_saved_form_id');
    if (savedFormId) {
      fetchFormResponses(activeToken, savedFormId);
    }
  };

  // --- GOOGLE DRIVE & DOCS MOUNTED HELPERS ---

  const fetchDriveFiles = async (activeToken: string, query = '') => {
    setDriveLoading(true);
    try {
      let url = 'https://www.googleapis.com/drive/v3/files?pageSize=8&fields=files(id,name,mimeType,webViewLink,iconLink)&q=trashed=false';
      if (query.trim()) {
        url += ` and name contains '${encodeURIComponent(query)}'`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveFiles(data.files || []);
      }
    } catch (e) {
      console.warn('Drive fetch error:', e);
    } finally {
      setDriveLoading(false);
    }
  };

  const findOrCreateJournal = async (activeToken: string, autoCreate = false) => {
    setJournalLoading(true);
    try {
      const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='My Sobriety %26 Gratitude Journal' and mimeType='application/vnd.google-apps.document' and trashed=false&fields=files(id,webViewLink)`;
      const searchRes = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!searchRes.ok) throw new Error('Failed to search Drive');
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        setJournalDocId(searchData.files[0].id);
        setJournalDocUrl(searchData.files[0].webViewLink);
        localStorage.setItem('myrecovery_saved_journal_id', searchData.files[0].id);
        localStorage.setItem('myrecovery_saved_journal_url', searchData.files[0].webViewLink);
      } else if (autoCreate) {
        const confirmed = window.confirm('Would you like to deploy a brand new "My Sobriety & Gratitude Journal" Google Document in your Google Drive folder?');
        if (!confirmed) return;

        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'My Sobriety & Gratitude Journal',
            mimeType: 'application/vnd.google-apps.document'
          })
        });
        if (!createRes.ok) throw new Error('Failed to create Journal Document');
        const fileObj = await createRes.json();
        
        const detailRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileObj.id}?fields=id,webViewLink`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        const detailData = await detailRes.json();
        
        setJournalDocId(detailData.id);
        setJournalDocUrl(detailData.webViewLink);
        localStorage.setItem('myrecovery_saved_journal_id', detailData.id);
        localStorage.setItem('myrecovery_saved_journal_url', detailData.webViewLink);
        setSuccessMsg('Created your official Google Doc diary!');
        fetchDriveFiles(activeToken);
      }
    } catch (e: any) {
      console.warn('Journal doc fetch/create error:', e);
    } finally {
      setJournalLoading(false);
    }
  };

  const handleAppendJournal = async () => {
    if (!token || !journalDocId || !journalText.trim()) return;
    
    const confirmed = window.confirm('Are you sure you want to securely append this entry to your "My Sobriety & Gratitude Journal" Google Document?');
    if (!confirmed) return;

    setJournalLoading(true);
    setErrorMsg('');
    try {
      const entryText = `\n\n--- Sobriety Journal Entry: ${new Date().toLocaleString()} (${daysSober} Days Sober) ---\n${journalText.trim()}\n`;
      const res = await fetch(`https://docs.googleapis.com/v1/documents/${journalDocId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                endOfSegmentLocation: { segmentId: '' },
                text: entryText
              }
            }
          ]
        })
      });
      if (!res.ok) throw new Error('Could not write entry to Google Docs');
      setJournalText('');
      setSuccessMsg('Successfully appended new entry to Google Docs journal!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to edit Document');
    } finally {
      setJournalLoading(false);
    }
  };

  // --- GOOGLE SHEETS MOUNTED HELPERS ---

  const findOrCreateSheet = async (activeToken: string, autoCreate = false) => {
    setSheetLoading(true);
    try {
      const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='My Sobriety %26 Mood Logs Tracker' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,webViewLink)`;
      const searchRes = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          setSheetId(searchData.files[0].id);
          setSheetUrl(searchData.files[0].webViewLink);
          localStorage.setItem('myrecovery_saved_sheet_id', searchData.files[0].id);
          localStorage.setItem('myrecovery_saved_sheet_url', searchData.files[0].webViewLink);
        } else if (autoCreate) {
          const confirmed = window.confirm('Create a brand new "My Sobriety & Mood Logs Tracker" Spreadsheet inside Google Drive to record progress backups?');
          if (!confirmed) return;

          const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              properties: { title: 'My Sobriety & Mood Logs Tracker' }
            })
          });
          if (!createRes.ok) throw new Error('Failed to initialize Google Sheet');
          const sheetObj = await createRes.json();
          const createdId = sheetObj.spreadsheetId;
          const createdUrl = sheetObj.spreadsheetUrl;

          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${createdId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${activeToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              values: [['Timestamp', 'Days Clean & Sober', 'Self-Assessment / Reflection', 'Ecosystem Origin']]
            })
          });

          setSheetId(createdId);
          setSheetUrl(createdUrl);
          localStorage.setItem('myrecovery_saved_sheet_id', createdId);
          localStorage.setItem('myrecovery_saved_sheet_url', createdUrl);
          setSuccessMsg('Successfully created your Sobriety Logs Google Sheets file!');
          fetchDriveFiles(activeToken);
        }
      }
    } catch (e: any) {
      console.warn('Sheets search/create error:', e);
    } finally {
      setSheetLoading(false);
    }
  };

  const handleAppendSheetRow = async () => {
    if (!token || !sheetId || !sheetNote.trim()) return;

    const confirmed = window.confirm(`Append new log entry worth ${sheetSoberDays} Days Sober to "My Sobriety & Mood Logs Tracker" Google Sheet?`);
    if (!confirmed) return;

    setSheetLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A2:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[new Date().toLocaleString(), sheetSoberDays, sheetNote.trim(), 'Spokane Recovery Companion App']]
        })
      });
      if (!res.ok) throw new Error('Could not append row to Google Sheets. Verify permissions.');
      setSheetNote('');
      setSuccessMsg('Successfully backed up recovery milestone to Google Sheet!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update Spreadsheet');
    } finally {
      setSheetLoading(false);
    }
  };

  // --- GMAIL & CONTACTS HELPERS ---

  const fetchContacts = async (activeToken: string) => {
    setContactsLoading(true);
    try {
      const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=15', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.connections || []);
      }
    } catch (e) {
      console.warn('Contacts fetch error:', e);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSendGmail = async () => {
    const finalTo = recipientEmail.trim() || selectedContact;
    if (!token || !finalTo || !gmailMessage.trim()) {
      setErrorMsg('Recipient email and message content are required.');
      return;
    }

    const confirmed = window.confirm(`Proceed to send this custom updates email to ${finalTo} from your Gmail account?`);
    if (!confirmed) return;

    setGmailLoading(true);
    setErrorMsg('');
    try {
      const emailContent = [
        `To: ${finalTo}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${gmailSubject.trim()}`,
        '',
        `<div>
          <h2 style="color: #2563eb; font-family: sans-serif;">myRecovery Support Update</h2>
          <p style="font-family: sans-serif; font-size: 14px; color: #1e293b;">${gmailMessage.trim()}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-family: sans-serif; font-size: 11px; color: #64748b; line-height: 1.5;">
            Sent with love via Spokane Recovery Network and Google Workspace Companion.<br/>
            Day by day, we find healing.
          </p>
        </div>`
      ].join('\r\n');

      const raw = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      if (!res.ok) throw new Error('Failed to transmit message through Gmail network');
      
      setSuccessMsg('Gmail sent successfully to your support buddy!');
      setRecipientEmail('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to send Gmail message');
    } finally {
      setGmailLoading(false);
    }
  };

  // --- GOOGLE MEET DYNAMIC HELPER ---

  const handleCreateMeetRoom = async () => {
    if (!token) return;

    const confirmed = window.confirm('Would you like to instantly generate and schedule a live peer-to-peer Google Meet room on your Google Calendar right now?');
    if (!confirmed) return;

    setMeetLoading(true);
    setErrorMsg('');
    setMeetLink('');
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: 'Emergency Peer Check-in: myRecovery Circle',
          description: 'Instant recovery session call launched from the Spokane Recovery Companion app.',
          start: {
            dateTime: now.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          conferenceData: {
            createRequest: {
              requestId: `meet-circle-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          }
        })
      });

      if (!res.ok) throw new Error('Failed to create Calendar Event with Google Meet conference data');
      const data = await res.json();
      
      const uri = data.conferenceData?.entryPoints?.[0]?.uri;
      if (uri) {
        setMeetLink(uri);
        setSuccessMsg('Google Meet link generated successfully!');
      } else {
        throw new Error('Google did not return a Meet conference link. Check scopes.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to launch Google Meet');
    } finally {
      setMeetLoading(false);
    }
  };

  // --- GOOGLE TASKS API ACTIONS ---
  
  const fetchTaskLists = async (activeToken: string) => {
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve task lists');
      const data = await res.json();
      setTaskLists(data.items || []);
      
      // Select the first list if none selected
      const savedList = localStorage.getItem('myrecovery_saved_list_id');
      if (!savedList && data.items && data.items.length > 0) {
        const targetId = data.items[0].id;
        setSelectedListId(targetId);
        localStorage.setItem('myrecovery_saved_list_id', targetId);
        fetchTasks(activeToken, targetId);
      } else if (savedList) {
        fetchTasks(activeToken, savedList);
      }
    } catch (error) {
      console.warn('Tasks API error:', error);
    }
  };

  const fetchTasks = async (activeToken: string, listId: string) => {
    if (!listId) return;
    setTasksLoading(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve tasks');
      const data = await res.json();
      setTasks(data.items || []);
    } catch (error) {
      console.warn('Error fetching tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleCreateTaskList = async () => {
    if (!token) return;
    setTasksLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'myRecovery Sobriety Plan' })
      });
      if (!res.ok) throw new Error('Could not create Sobriety Plan list');
      const newList = await res.json();
      
      setTaskLists(prev => [newList, ...prev]);
      setSelectedListId(newList.id);
      localStorage.setItem('myrecovery_saved_list_id', newList.id);
      
      // Auto populate template checklist items
      await addTemplateTasks(newList.id);
      setSuccessMsg('Created customized Sobriety Plan checklist in your Google Tasks!');
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create Tasks list');
    } finally {
      setTasksLoading(false);
    }
  };

  const addTemplateTasks = async (listId: string) => {
    const templates = [
      'Complete Daily Mood Check-In',
      'Attend online or in-person recovery meeting',
      'Call / Check-In with Sponsor or Mentor',
      'Practice 5 minutes of focused breathing',
      'Read recovery literature or affirmations'
    ];

    for (const t of templates) {
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: t })
      });
    }
    fetchTasks(token!, listId);
  };

  const handleAddTask = async () => {
    if (!token || !selectedListId || !newTaskTitle.trim()) return;
    setTasksLoading(true);
    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTaskTitle.trim() })
      });
      if (!res.ok) throw new Error('Failed to append task');
      setNewTaskTitle('');
      fetchTasks(token, selectedListId);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not add task');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!token || !selectedListId) return;
    const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
    
    // Optimistic UI toggle updates
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedListId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus
        })
      });
      if (!res.ok) throw new Error('Failed to toggle task');
    } catch (error) {
      // Revert optimistic state
      fetchTasks(token, selectedListId);
    }
  };


  // --- GOOGLE CHAT API ACTIONS ---

  const fetchChatSpaces = async (activeToken: string) => {
    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error('Failed to load chat environments');
      const data = await res.json();
      setSpaces(data.spaces || []);
      
      const savedSpace = localStorage.getItem('myrecovery_saved_space_id');
      if (!savedSpace && data.spaces && data.spaces.length > 0) {
        setSelectedSpaceId(data.spaces[0].name);
        localStorage.setItem('myrecovery_saved_space_id', data.spaces[0].name);
      }
    } catch (error) {
      console.warn('Chat spaces error:', error);
    }
  };

  const handlePostToSpace = async (predefinedMessage?: string) => {
    const messageToSend = predefinedMessage || chatMessage;
    if (!messageToSend.trim()) return;

    // Assemble new local simulator element
    const newSimMsg = {
      id: `msg-${Date.now()}`,
      sender: userName || 'Me',
      message: messageToSend.trim(),
      timestamp: 'Just now',
      avatar: '✊',
      likes: 0
    };
    setSimulatorMessages(prev => [...prev, newSimMsg]);

    if (token && selectedSpaceId) {
      setChatLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: messageToSend.trim() })
        });
        if (!res.ok) throw new Error('Unable to send support trigger message');
        setChatMessage('');
        setSuccessMsg('Message posted successfully to Google Chat support circle!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (error: any) {
        setErrorMsg(`${error.message || 'Could not post to Google Chat'}. Message kept in simulator.`);
      } finally {
        setChatLoading(false);
      }
    } else {
      setChatMessage('');
      setSuccessMsg(`Simulated message in your Google Chat preview room!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };


  // --- GOOGLE FORMS API ACTIONS ---

  const handleCreateWellnessForm = async (templateOverride?: 'general' | 'sponsor' | 'meeting') => {
    if (!token) return;
    const template = templateOverride || selectedFormTemplate;
    setFormsLoading(true);
    setErrorMsg('');
    setFormAnalysis('');
    try {
      let formTitle = 'myRecovery Reflections & Daily Check-In';
      let documentTitle = 'myRecovery Daily Check-In';
      let updateRequests: any[] = [];

      if (template === 'sponsor') {
        formTitle = 'myRecovery Sponsor Accountability Check-In';
        documentTitle = 'Sponsor Check-In Form';
        updateRequests = [
          {
            createItem: {
              item: {
                title: 'How intense were your cravings/temptations today?',
                description: 'Assess honestly so we can adjust support vectors.',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: '1 - Zero cravings, feeling completely steady' },
                        { value: '2 - Fleeting thoughts but easily dismissed' },
                        { value: '3 - Moderate cravings, had to use recovery practices' },
                        { value: '4 - Strong cravings, needed support contact' },
                        { value: '5 - Crisis-level cravings, actively struggling' }
                      ]
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Did you connect with your Sponsor or Support Peers today?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Yes, had a deep connection or meeting' },
                        { value: 'Yes, short check-in/text message' },
                        { value: 'No, but I did self-reflection' },
                        { value: 'No contact with supports today' }
                      ]
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Which 12-Step or Recovery Work did you practice today?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'CHECKBOX',
                      options: [
                        { value: 'Read program literature / text study' },
                        { value: 'Wrote on steps / spiritual inventory' },
                        { value: 'Meditated or said routine prayers' },
                        { value: 'Shared with a sponsee / peer help' }
                      ]
                    }
                  }
                }
              },
              location: { index: 2 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Accountability Notes, Prayer Targets, or General Comments:',
                questionItem: {
                  question: {
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 3 }
            }
          }
        ];
      } else if (template === 'meeting') {
        formTitle = 'myRecovery 12-Step Meeting Review Log';
        documentTitle = 'Meeting Review Survey';
        updateRequests = [
          {
            createItem: {
              item: {
                title: 'What was the exact name or group of the meeting?',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: { paragraph: false }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Fellowship Format & Key Focus',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Discussion style' },
                        { value: 'Speaker story presentation' },
                        { value: 'Big Book or literature reading' },
                        { value: 'Step / Tradition focus' }
                      ]
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: 'How connected and safe did you find this meeting environment?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Excellent - high connection, strong fellowship' },
                        { value: 'Good - standard welcoming environment' },
                        { value: 'Neutral - small attendance, quiet crowd' },
                        { value: 'Isolated - did not feel welcome / unsafe' }
                      ]
                    }
                  }
                }
              },
              location: { index: 2 }
            }
          },
          {
            createItem: {
              item: {
                title: 'What was the primary speaker takeaway or message of hope?',
                questionItem: {
                  question: {
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 3 }
            }
          }
        ];
      } else {
        // General / Wellness
        formTitle = 'myRecovery Reflections & Daily Check-In';
        documentTitle = 'myRecovery Daily Check-In';
        updateRequests = [
          {
            createItem: {
              item: {
                title: 'How is your mental/emotional outlook today?',
                description: 'Reflect on how steady you feel.',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'RADIO',
                      options: [
                        { value: 'Feeling super strong & solid' },
                        { value: 'Steady and productive today' },
                        { value: 'Neutral, standard checkout' },
                        { value: 'Feeling tired, a bit uneasy' },
                        { value: 'Highly stressed or experiencing cravings' }
                      ]
                    }
                  }
                }
              },
              location: { index: 0 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Did you complete your critical recovery routines?',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'CHECKBOX',
                      options: [
                        { value: 'Logged mood or shared reflection' },
                        { value: 'Attended recovery support group' },
                        { value: 'Checked in with a mentor / sponsor' },
                        { value: 'Practiced breathing / daily literature' }
                      ]
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          },
          {
            createItem: {
              item: {
                title: 'Share any key thoughts, barriers, or victories:',
                questionItem: {
                  question: {
                    textQuestion: { paragraph: true }
                  }
                }
              },
              location: { index: 2 }
            }
          }
        ];
      }

      // Step A: Create standard Form
      const resCreate = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: formTitle,
            documentTitle: documentTitle
          }
        })
      });
      if (!resCreate.ok) throw new Error('Failed to instantiate Form');
      const formObj = await resCreate.json();
      const formId = formObj.formId;
      const responderUri = formObj.responderUri;

      // Step B: Set up questions in a batch update
      const updateData = {
        requests: updateRequests
      };

      const resBatch = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!resBatch.ok) throw new Error('Failed to configure form questions');

      setGeneratedFormId(formId);
      setGeneratedFormUrl(responderUri);
      localStorage.setItem('myrecovery_saved_form_id', formId);
      localStorage.setItem('myrecovery_saved_form_url', responderUri);
      localStorage.setItem('myrecovery_saved_form_template', template);
      
      setSuccessMsg('Your custom Google Form was generated successfully!');
      fetchFormResponses(token, formId);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not provision form structure');
    } finally {
      setFormsLoading(false);
    }
  };

  const fetchFormResponses = async (activeToken: string, formId: string) => {
    try {
      const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error('Failed to gather responses');
      const data = await res.json();
      setFormResponses(data.responses || []);
    } catch (error) {
      console.warn('Form responses fetch failed:', error);
    }
  };

  const handleAnalyzeResponses = async () => {
    if (!token || !generatedFormId || formResponses.length === 0) return;
    setAnalysisLoading(true);
    setErrorMsg('');
    setFormAnalysis('');
    try {
      const response = await fetch('/api/ai/analyze-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: formResponses,
          formTitle: selectedFormTemplate === 'sponsor' 
                     ? 'Sponsor Check-In Form' 
                     : selectedFormTemplate === 'meeting' 
                     ? 'Meeting Review Log' 
                     : 'Wellness Check-in'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response analysis.');
      }

      const data = await response.json();
      setFormAnalysis(data.analysis || 'No detailed patterns found.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to complete wellness study.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // --- GOOGLE SLIDES REST API ACTIONS & EXPLORER ---

  const fetchPresentations = async (activeToken: string) => {
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.presentation' and trashed=false&pageSize=6&fields=files(id,name,webViewLink)", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPresentationsList(data.files || []);
      }
    } catch (e) {
      console.warn("Slides fetch error:", e);
    }
  };

  const handleCreateCelebrationPresentation = async () => {
    if (!token) return;

    const confirmed = window.confirm("Design a brand-new customized 'Sobriety Celebration Story' Google Slides deck in your Google Drive folder?");
    if (!confirmed) return;

    setSlidesLoading(true);
    setErrorMsg('');
    try {
      const resCreate = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `My Sobriety Celebration Deck - ${userName}`
        })
      });
      if (!resCreate.ok) throw new Error('Failed to create Slides presentation');
      const deck = await resCreate.json();
      const newPresId = deck.presentationId;
      const webViewLink = `https://docs.google.com/presentation/d/${newPresId}/edit`;

      // Batch update to add nice presentation boilerplate slides (with customized milestone stats)
      const updateData = {
        requests: [
          {
            createSlide: {
              objectId: "sober_stats_slide",
              insertionIndex: 1,
              slideLayoutReference: {
                predefinedLayout: "TITLE_AND_BODY"
              }
            }
          },
          {
            createSlide: {
              objectId: "gratitude_slide",
              insertionIndex: 2,
              slideLayoutReference: {
                predefinedLayout: "TITLE_AND_BODY"
              }
            }
          }
        ]
      };

      const resUpdate = await fetch(`https://slides.googleapis.com/v1/presentations/${newPresId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      setPresentationId(newPresId);
      setPresentationUrl(webViewLink);
      localStorage.setItem('myrecovery_saved_slides_id', newPresId);
      localStorage.setItem('myrecovery_saved_slides_url', webViewLink);
      setSuccessMsg(`Successfully created your custom Sobriety Celebration Slideshow!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchPresentations(token);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not instantiate Google Slides presentation');
    } finally {
      setSlidesLoading(false);
    }
  };

  // --- GOOGLE WORKSPACE DRIVE PICKER INTEGRATION ---

  const fetchPickerFiles = async (activeToken: string, query = '', typeFilter = 'all') => {
    setPickerLoading(true);
    try {
      let mimeQuery = '';
      if (typeFilter === 'slides') mimeQuery = " and mimeType='application/vnd.google-apps.presentation'";
      else if (typeFilter === 'docs') mimeQuery = " and mimeType='application/vnd.google-apps.document'";
      else if (typeFilter === 'sheets') mimeQuery = " and mimeType='application/vnd.google-apps.spreadsheet'";
      else if (typeFilter === 'forms') mimeQuery = " and mimeType='application/vnd.google-apps.form'";

      let url = `https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,webViewLink,iconLink)&q=trashed=false${mimeQuery}`;
      if (query.trim()) {
        url += ` and name contains '${encodeURIComponent(query)}'`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPickerFiles(data.files || []);
      }
    } catch (e) {
      console.warn('Picker error:', e);
    } finally {
      setPickerLoading(false);
    }
  };

  const handlePickFile = (file: any) => {
    setSelectedPickedFile(file);
    
    // Bind depending on mimetype
    if (file.mimeType === 'application/vnd.google-apps.presentation') {
      setPresentationId(file.id);
      setPresentationUrl(file.webViewLink);
      localStorage.setItem('myrecovery_saved_slides_id', file.id);
      localStorage.setItem('myrecovery_saved_slides_url', file.webViewLink);
      setSuccessMsg(`Picked & Bound slide deck: "${file.name}"!`);
    } else if (file.mimeType === 'application/vnd.google-apps.form') {
      setGeneratedFormId(file.id);
      setGeneratedFormUrl(file.webViewLink);
      localStorage.setItem('myrecovery_saved_form_id', file.id);
      localStorage.setItem('myrecovery_saved_form_url', file.webViewLink);
      setSuccessMsg(`Picked and Bound Google Form: "${file.name}"!`);
      fetchFormResponses(token!, file.id);
    } else if (file.mimeType === 'application/vnd.google-apps.document') {
      setJournalDocId(file.id);
      setJournalDocUrl(file.webViewLink);
      localStorage.setItem('myrecovery_saved_journal_id', file.id);
      localStorage.setItem('myrecovery_saved_journal_url', file.webViewLink);
      setSuccessMsg(`Picked and Bound Google Doc Journal: "${file.name}"!`);
    } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      setSheetId(file.id);
      setSheetUrl(file.webViewLink);
      localStorage.setItem('myrecovery_saved_sheet_id', file.id);
      localStorage.setItem('myrecovery_saved_sheet_url', file.webViewLink);
      setSuccessMsg(`Picked and Bound Spreadsheet: "${file.name}"!`);
    } else {
      setSuccessMsg(`Picked file: "${file.name}"!`);
    }
    
    setTimeout(() => setSuccessMsg(''), 4000);
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header Info */}
      <div className="bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-500" /> Workspace Integrations
          </h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-1">
            Seamlessly combine your Recovery dashboard with your daily Google Workspace flow.
          </p>
        </div>

        <div>
          {!token ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/30 cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <Calendar size={16} /> Connect Google Account
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsPickerOpen(true);
                  if (token) fetchPickerFiles(token, '', 'all');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 border border-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Google Picker to browse and select files"
              >
                <FolderOpen size={13} /> Open Google Picker
              </button>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                  Workspace Connected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-500 text-xs font-bold leading-relaxed">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>Error: {errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-300 text-xs font-bold leading-relaxed">
          <Check size={16} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {!token ? (
        <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 text-center space-y-4">
          <div className="p-4 bg-blue-500/5 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-blue-500 border border-blue-500/10">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Sync Your Sobriety Journey</h3>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-md mx-auto">
            Authorize Google to access Sobriety Tasks, Chat Forums, Forms, Drive Journals, Docs Backups, Sheets Progress Analyzers, Contacts sync, and Instant Support Meet rooms.
          </p>
          <button
            onClick={handleConnect}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            Authenticate Google Workspace
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB BAR */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'daily' 
                  ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' 
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <CheckSquare size={13} /> Daily Checklist & Forums
            </button>

            <button
              onClick={() => setActiveTab('forms')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'forms' 
                  ? 'bg-violet-600/10 text-violet-400 border-b-2 border-violet-500' 
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <FileText size={13} /> Google Forms Wellness Checklist
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'drive' 
                  ? 'bg-amber-600/10 text-amber-400 border-b-2 border-amber-500' 
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <HardDrive size={13} /> Sobriety Journal (Drive & Docs)
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'sheets' 
                  ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500' 
                  : 'text-slate-400 hover:text-slate-205'
              }`}
            >
              <Grid size={13} /> Recovery Sheet Backups
            </button>

            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'gmail' 
                  ? 'bg-violet-600/10 text-violet-400 border-b-2 border-violet-500' 
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              <Mail size={13} /> Contacts Gmail Broadcast
            </button>

            <button
              onClick={() => setActiveTab('meet')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'meet' 
                  ? 'bg-pink-600/10 text-pink-400 border-b-2 border-pink-500' 
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              <Video size={13} /> Meet Instant Circles
            </button>

            <button
              onClick={() => setActiveTab('slides')}
              className={`px-4 py-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'slides' 
                  ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' 
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              <Presentation size={13} /> Slides Milestone Deck
            </button>
          </div>

          {/* TAB CONTENT - DAILY CHECKLISTS & FORUMS */}
          {activeTab === 'daily' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. GOOGLE TASKS CHECKLIST INTERACTIVE CARD */}
                <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/10">
                          <CheckSquare size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Tasks Checklist</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sobriety Action Plan</p>
                        </div>
                      </div>
                      
                      {taskLists.length > 0 && (
                        <select
                          value={selectedListId}
                          onChange={(e) => {
                            setSelectedListId(e.target.value);
                            localStorage.setItem('myrecovery_saved_list_id', e.target.value);
                            fetchTasks(token, e.target.value);
                          }}
                          className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-bold max-w-[150px] focus:outline-none"
                        >
                          {taskLists.map(list => (
                            <option key={list.id} value={list.id}>{list.title}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {tasksLoading ? (
                      <div className="py-12 flex flex-col items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <span className="animate-spin inline-block w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full" />
                        Loading Action plan...
                      </div>
                    ) : tasks.length > 0 ? (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {tasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="group p-3.5 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                task.status === 'completed' 
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20' 
                                  : 'border-slate-800 group-hover:border-slate-600'
                              }`}>
                                {task.status === 'completed' && <Check size={12} className="stroke-[3]" />}
                              </div>
                              <span className={`text-[11px] font-semibold tracking-tight transition-all ${
                                task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'
                              }`}>
                                {task.title}
                              </span>
                            </div>
                            
                            {task.status !== 'completed' && (
                              <div className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                Do Checklist
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-950/20 border border-slate-800/60 rounded-2xl text-center space-y-3">
                        <AlertTriangle className="text-amber-500/60 mx-auto" size={28} />
                        <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                          No sobriety tasks found in this active Google Task List.
                        </p>
                        <button
                          onClick={handleCreateTaskList}
                          className="px-5 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Setup Sobriety Plan list
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedListId && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddTask();
                      }} 
                      className="flex gap-2 bg-slate-950 border border-slate-800 p-1 rounded-2xl"
                    >
                      <input
                        type="text"
                        placeholder="New recovery checklist item..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-grow bg-transparent px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newTaskTitle.trim() || tasksLoading}
                        className="p-2.5 bg-blue-600 hover:bg-blue-500 hover:scale-105 disabled:bg-slate-900 disabled:scale-100 text-white rounded-xl transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </form>
                  )}
                </div>

                {/* 2. GOOGLE CHAT SUPPORT CIRCLE */}
                <div id="google-chat-circle-panel" className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-pink-500/10 rounded-2xl text-pink-500 border border-pink-500/10">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Chat Circle</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Support Room Broadcast & Log</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {spaces.length > 0 ? (
                        <select
                          value={selectedSpaceId}
                          onChange={(e) => {
                            setSelectedSpaceId(e.target.value);
                            localStorage.setItem('myrecovery_saved_space_id', e.target.value);
                          }}
                          className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-bold max-w-[150px] focus:outline-none"
                        >
                          {spaces.map(space => (
                            <option key={space.name} value={space.name}>
                              {space.displayName || space.name.split('/').pop()}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[8px] bg-slate-950 px-2 py-0.5 border border-slate-805 text-slate-500 rounded font-mono uppercase font-bold">Simulator Connected</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Broadcast immediate support alerts, milestone check-ins, or daily positive habits directly to your recovery circle.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Send & Broadcast Utilities */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Speed Broadcast Templates</h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          onClick={() => handlePostToSpace(`🎉 myRecovery Milestone: ${userName} has achieved ${daysSober} Days clean and sober! Day by day!`)}
                          disabled={chatLoading}
                          className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider leading-none">Standard Milestone Report</p>
                            <p className="text-[8px] text-slate-400 mt-1">Broadcast {daysSober} clean days progress</p>
                          </div>
                          <Share2 size={12} className="group-hover:translate-x-0.5 transition-all text-emerald-400" />
                        </button>

                        <button
                          onClick={() => {
                            const conf = window.confirm("Are you sure you want to broadcast an urgent SOS message? Your entire Support Space will receive a priority alert.");
                            if (conf) {
                              handlePostToSpace(`🚨 [SOS PRIORITY SEEKING CONNECTION]: ${userName} has active thoughts or cravings and requested immediate contact! Standard recovery checklist trigger.`);
                            }
                          }}
                          disabled={chatLoading}
                          className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 hover:border-rose-500/30 text-rose-500 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider leading-none">Emergency SOS beacon</p>
                            <p className="text-[8px] text-slate-400 mt-1">Request urgent support in real-time</p>
                          </div>
                          <AlertTriangle size={13} className="group-hover:scale-110 text-rose-400 animate-pulse" />
                        </button>

                        <button
                          onClick={() => handlePostToSpace(`🌱 Gratitude Circle: Today I am grateful for a supportive recovery community, a new sober clean mindset, and another day of progress!`)}
                          disabled={chatLoading}
                          className="p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/15 hover:border-blue-500/30 text-blue-400 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-wider leading-none">Share Daily Gratitude Statement</p>
                            <p className="text-[8px] text-slate-400 mt-1">Append customized mindfulness thoughts</p>
                          </div>
                          <CheckSquare size={12} className="group-hover:scale-105 text-blue-400" />
                        </button>
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handlePostToSpace();
                        }} 
                        className="flex gap-2 bg-slate-950 border border-slate-800 p-1 rounded-2xl"
                      >
                        <input
                          type="text"
                          placeholder="Send immediate broadcast thoughts..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="flex-grow bg-transparent px-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!chatMessage.trim() || chatLoading}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          Post Message <Send size={10} />
                        </button>
                      </form>
                    </div>

                    {/* Chat Feed Timeline Simulator */}
                    <div className="bg-slate-955 bg-slate-955 shadow-inner bg-[#0f172a]/40 border border-slate-800 p-5 rounded-[2.2rem] space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                            Live Recovery Channel Stream
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold uppercase">Activity Log</span>
                        </div>

                        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                          {simulatorMessages.map((msg) => (
                            <div key={msg.id} className="p-3 bg-slate-950/70 border border-slate-900 rounded-xl space-y-1.5 hover:border-slate-800 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px]">{msg.avatar}</span>
                                  <span className="text-[9px] font-black text-slate-200 uppercase tracking-wide leading-none">{msg.sender}</span>
                                </div>
                                <span className="text-[7px] text-slate-500 font-bold font-mono uppercase">{msg.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold pr-4">{msg.message}</p>
                              
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => {
                                    setSimulatorMessages(prev => prev.map(m => m.id === msg.id ? { ...m, likes: m.likes + 1 } : m));
                                  }}
                                  className="text-[9px] font-mono text-slate-500 hover:text-pink-400 tracking-wider flex items-center gap-1 transition-colors"
                                >
                                  ❤️ {msg.likes}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-900 pt-3 flex justify-between items-center">
                        <button
                          onClick={() => {
                            setIsSetupTourOpen(!isSetupTourOpen);
                          }}
                          className="text-[8.5px] font-black uppercase text-slate-400 hover:text-pink-400 tracking-wider underline cursor-pointer"
                        >
                          {isSetupTourOpen ? 'Hide Developer Instructions' : 'View Developer Setup Instructions'}
                        </button>
                        <span className="text-[8px] font-mono font-bold text-slate-600 uppercase">Google Chat Spaces API v1</span>
                      </div>
                    </div>
                  </div>

                  {/* SETUP TOUR DOCS ACCORDION */}
                  {isSetupTourOpen && (
                    <div className="p-5 bg-slate-950/60 border border-slate-850 rounded-2xl text-slate-350 space-y-3.5 text-[11px] font-semibold leading-relaxed">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">🛠️ Google Chat Workspace API Setup</h4>
                      <p>
                        To sync this app with your real organization / channel spaces in Google Chat, complete these integration steps in your developer console:
                      </p>
                      <ul className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                        <li>Ensure you have authenticated Google Workspace with the <span className="text-pink-400 font-bold">chat.spaces</span> scope enabled in your OAuth screen.</li>
                        <li>Install the GCP project application Bot as a Space Member to receive immediate notifications.</li>
                        <li>Verify credentials: If no real spaces appear, create a brand-new space in Google Chat with you and your recovery companions, and it will be indexed instantly upon page refresh.</li>
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

              {/* TAB CONTENT - GOOGLE FORMS WELLNESS REFLECTION ENGINE */}
              {activeTab === 'forms' && (
                <div className="space-y-8 animate-fade-in w-full">
                  <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-violet-500/10 rounded-2xl text-violet-500 border border-violet-500/10">
                          <FileText size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white uppercase tracking-wider">Google Forms Well-being Hub</h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 font-mono">Deploy Personal Forms & Deep-Review Metrics</p>
                        </div>
                      </div>

                      {generatedFormId && (
                        <button
                          onClick={() => fetchFormResponses(token!, generatedFormId)}
                          disabled={formsLoading}
                          className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-805"
                        >
                          <RefreshCw size={12} className={formsLoading ? 'animate-spin' : ''} />
                          Fetch Responses
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Creations / Templates Selector */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-violet-400 uppercase tracking-widest font-mono">Select Assessment Template</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                            Provision custom assessment sheets directly into your personal Google Workspace account. Use them for your own reflection logs or distribute links directly to sponsees and recovery support peers in Spokane!
                          </p>
                        </div>

                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block px-1">Template Scheme</label>
                            <select
                              value={selectedFormTemplate}
                              onChange={(e) => setSelectedFormTemplate(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-slate-200 font-bold focus:outline-none"
                            >
                              <option value="general">Daily Progress & Mental Outlook Tracker</option>
                              <option value="sponsor">Sponsor-Sponsee Accountability Logs</option>
                              <option value="meeting">12-Step Meeting Review Survey</option>
                            </select>
                          </div>

                          {/* Display Template Question Preview */}
                          <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-2xl space-y-3">
                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Questions Included in Deployment:</div>
                            <ul className="space-y-2 text-[11px] font-semibold text-slate-400 pl-1.5 list-disc list-inside">
                              {selectedFormTemplate === 'general' && (
                                <>
                                  <li>Outlook Check: "How is your mental/emotional outlook today?" (Radio Options)</li>
                                  <li>Habits Tracker: "Did you complete critical recovery routines?" (Checkboxes)</li>
                                  <li>Victoria log: "Share thoughts, barriers, or victories." (Paragraph Text)</li>
                                </>
                              )}
                              {selectedFormTemplate === 'sponsor' && (
                                <>
                                  <li>Craving Index: "Cravings intensity level today?" (Radio 1-5 range)</li>
                                  <li>Support Network: "Did you contact your Sponsor/Peers today?" (Radio Options)</li>
                                  <li>Active Practices: "Which recovery work was completed?" (Checkboxes)</li>
                                  <li>Prayer/Needs: "Accountability notes, prayer requests." (Paragraph Text)</li>
                                </>
                              )}
                              {selectedFormTemplate === 'meeting' && (
                                <>
                                  <li>Meeting details: "What was the name/group of the meeting?" (Text Response)</li>
                                  <li>Program Format: "Fellowship format & key focus?" (Radio Options)</li>
                                  <li>Vibe: "How connected and safe was the meeting atmosphere?" (Radio Options)</li>
                                  <li>Key takeaway: "Speaker summary or message of hope?" (Paragraph Text)</li>
                                </>
                              )}
                            </ul>
                          </div>

                          <button
                            onClick={() => handleCreateWellnessForm()}
                            disabled={formsLoading}
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {formsLoading ? (
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-violet-200 border-t-white rounded-full" />
                            ) : (
                              <>
                                <Plus size={16} /> Deploy & Bind Google Form
                              </>
                            )}
                          </button>

                          {generatedFormId && (
                            <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl space-y-3">
                              <div className="w-full flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                <span>Active Survey Link</span>
                                <span className="text-emerald-500 flex items-center gap-0.5 font-bold">
                                  <Check size={8} className="stroke-[3]" /> Bound & Live
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate w-full font-bold bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-850">{generatedFormUrl}</p>
                              
                              <div className="flex gap-2">
                                <a 
                                  href={generatedFormUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex-1 py-3 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-xl text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-violet-500/20"
                                >
                                  Open Google Form <ExternalLink size={11} />
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedFormUrl);
                                    setSuccessMsg('Form link copied to clipboard!');
                                    setTimeout(() => setSuccessMsg(''), 3000);
                                  }}
                                  className="p-3 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl transition-all border border-slate-800 cursor-pointer"
                                >
                                  <Clipboard size={14} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Frame: Live responses & analysis */}
                      <div className="bg-slate-950/40 p-6 border border-slate-850 rounded-[2rem] flex flex-col justify-between space-y-6 h-full">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-3">
                            <span>Check-In Submissions</span>
                            <span className="text-violet-400 font-mono font-bold">{formResponses.length} Responses</span>
                          </div>

                          {generatedFormId ? (
                            formResponses.length > 0 ? (
                              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                                {formResponses.map((resp, i) => {
                                  const subTime = resp.lastSubmittedTime ? new Date(resp.lastSubmittedTime) : null;
                                  
                                  const getResponseAnswers = (responseObj: any) => {
                                    if (!responseObj.answers) return [];
                                    return Object.values(responseObj.answers).map((ansObj: any) => {
                                      const ansList = ansObj.textAnswers?.answers || [];
                                      return ansList.map((a: any) => a.value).join(', ');
                                    }).filter(Boolean);
                                  };

                                  const answers = getResponseAnswers(resp);

                                  return (
                                    <div key={resp.responseId || i} className="p-4 bg-slate-900/95 border border-slate-805 rounded-2xl space-y-2.5 hover:border-slate-750 transition-colors">
                                      <div className="flex justify-between items-center text-[8.5px] font-mono font-black text-slate-500">
                                        <span className="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/10 font-bold">REP #{formResponses.length - i}</span>
                                        <span>{subTime ? subTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                                      </div>
                                      <div className="space-y-2">
                                        {answers.map((answerStr, index) => (
                                          <p key={index} className="text-[11px] text-slate-350 font-semibold leading-relaxed pl-2 border-l-2 border-violet-500/40">
                                            {answerStr}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-12 text-center space-y-3">
                                <span className="text-2xl">⏳</span>
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none">Awaiting Submissions</p>
                                <p className="text-[10px] text-slate-500 font-semibold max-w-[240px] mx-auto leading-relaxed pt-1.5">
                                  No submissions found in this custom Google Form yet. Press the 'Open Google Form' link above, submit a check-in, and click 'Fetch Responses'.
                                </p>
                              </div>
                            )
                          ) : (
                            <div className="py-16 text-center text-slate-650 text-xs font-black uppercase tracking-widest font-mono">
                              Form is currently inactive
                            </div>
                          )}
                        </div>

                        {generatedFormId && formResponses.length > 0 && (
                          <div className="pt-4 border-t border-slate-900 space-y-4">
                            <button
                              onClick={handleAnalyzeResponses}
                              disabled={analysisLoading}
                              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {analysisLoading ? (
                                <>
                                  <RefreshCw size={12} className="animate-spin" /> Analyzing Wellbeing Logs...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={13} className="text-amber-300 animate-pulse" /> ✨ Analyze Submissions with Gemini AI
                                </>
                              )}
                            </button>

                            {formAnalysis && (
                              <div className="p-5 bg-slate-900 border border-violet-500/20 rounded-2xl text-slate-300 text-[11px] font-semibold leading-relaxed space-y-3 max-h-[300px] overflow-y-auto">
                                <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5 font-mono">
                                  <Sparkles size={11} className="text-violet-400 animate-pulse" /> SOBER SPOKANE COACH REPORT
                                </div>
                                <div className="markdown-body text-slate-350 bg-transparent">
                                  <ReactMarkdown>{formAnalysis || ''}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-[8px] text-slate-500 font-bold leading-normal pt-2 select-none uppercase text-center font-mono">
                          Form replies are fetched and parsed directly from the Google Forms API.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* TAB CONTENT - SOBRIETY JOURNAL (DRIVE & DOCS) */}
          {activeTab === 'drive' && (
            <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/10">
                  <HardDrive size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Sobriety Docs & Journal</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Google Drive & Google Docs Journaling Engine</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* WRITE / APPEND COMPONENT */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Create or Sync Sobriety Journal</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Maintain an official Recovery journal directly synced inside your Google Drive as a beautiful Google Doc! All raw journal actions are stored in your secure personal storage.
                    </p>
                  </div>

                  {!journalDocId ? (
                    <button
                      onClick={() => findOrCreateJournal(token, true)}
                      disabled={journalLoading}
                      className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {journalLoading ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>
                          <Plus size={15} /> Deploy "My Sobriety & Gratitude Journal" Doc
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Active Doc Card */}
                      <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="truncate">
                          <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider">Active Workspace Document</p>
                          <p className="text-xs font-bold text-white truncate">My Sobriety & Gratitude Journal</p>
                        </div>
                        <a 
                          href={journalDocUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 border border-slate-800 transition-all"
                        >
                          Open Doc <ExternalLink size={10} />
                        </a>
                      </div>

                      {/* Fast Entry editor */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Write Instant Reflection Entry</label>
                        <textarea
                          rows={4}
                          value={journalText}
                          onChange={(e) => setJournalText(e.target.value)}
                          placeholder="Type your goals, emotional states, breathing sessions, and sober thoughts to append straight to the end of your Google Doc..."
                          className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-amber-500/50 focus:outline-none leading-relaxed"
                        />
                        <button
                          onClick={handleAppendJournal}
                          disabled={!journalText.trim() || journalLoading}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {journalLoading ? (
                            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            <>
                              <Send size={12} /> Append Entry to Journal Doc
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* FILE PICKER / VIEWER - CUSTOM ZERO-SDK PICKER FALLBACK */}
                <div className="bg-slate-950/40 p-5 border border-slate-800 rounded-[2rem] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Drive File Explorer</h4>
                      <button 
                        onClick={() => fetchDriveFiles(token, driveSearchQuery)}
                        className="text-[8px] font-black text-slate-500 hover:text-slate-300 uppercase flex items-center gap-1"
                      >
                        <RefreshCw size={8} /> Refresh Drive
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Search file names..."
                        value={driveSearchQuery}
                        onChange={(e) => {
                          setDriveSearchQuery(e.target.value);
                          fetchDriveFiles(token, e.target.value);
                        }}
                        className="flex-grow bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-705 focus:outline-none"
                      />
                    </div>

                    {driveLoading ? (
                      <div className="py-8 text-center text-slate-600 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-1">
                        <span className="animate-spin inline-block w-5 h-5 border-2 border-slate-800 border-t-amber-500 rounded-full" />
                        Fetching Files...
                      </div>
                    ) : driveFiles.length > 0 ? (
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {driveFiles.map(file => (
                          <a 
                            key={file.id}
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-slate-950 border border-slate-900/60 hover:bg-slate-900 rounded-xl flex items-center justify-between gap-3 text-slate-300 hover:text-white transition-all group"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="shrink-0 text-amber-500">
                                <FileText size={15} />
                              </span>
                              <span className="text-[10px] font-bold truncate leading-none">{file.name}</span>
                            </div>
                            <span className="text-[8px] text-slate-500 font-bold uppercase group-hover:text-amber-400 transition-colors">
                              View ID
                            </span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-550 italic text-center py-6 font-semibold">No documents found matching search terms.</p>
                    )}
                  </div>

                  <div className="text-[8px] text-slate-500 leading-normal border-t border-slate-900 pt-3 font-semibold uppercase">
                    Select open files instantly to fetch ID strings or view raw Drive assets.
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT - RECOVERY LOGS BACKUP SHEET */}
          {activeTab === 'sheets' && (
            <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/10">
                  <Grid size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Google Sheets Logs</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Google Sheets Progress Backups & Logging Sheets</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Sync Actions left */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Connect spreadsheet table</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Synchronize your daily sobriety log backups with your own personal Google Sheets file inside Drive. Plot charts, check logs, and maintain permanent data ownership.
                    </p>

                    {!sheetId ? (
                      <button
                        onClick={() => findOrCreateSheet(token, true)}
                        disabled={sheetLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {sheetLoading ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <>
                            <Plus size={15} /> Create "My Sobriety & Mood Logs Tracker" Sheet
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="truncate">
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Active Workspace Spreadsheet</p>
                          <p className="text-xs font-bold text-white truncate">My Sobriety Logs Tracker</p>
                        </div>
                        <a 
                          href={sheetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 border border-slate-800 transition-all"
                        >
                          View Spreadsheet <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>

                  {sheetId && (
                    <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">Append Row Backup</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 font-bold uppercase">Timestamp</label>
                          <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-[10px] text-slate-400 font-bold">
                            {new Date().toLocaleDateString()}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 font-bold uppercase">Sober Days Count</label>
                          <input 
                            type="number"
                            value={sheetSoberDays}
                            onChange={(e) => setSheetSoberDays(Number(e.target.value))}
                            className="w-full p-2 bg-slate-950 border border-slate-900 rounded-xl text-[10px] text-white font-bold text-center focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 font-bold lg:tracking-wider uppercase">Assess Mental Space / Feelings Note</label>
                        <input 
                          type="text"
                          value={sheetNote}
                          onChange={(e) => setSheetNote(e.target.value)}
                          placeholder="e.g. Clean headspace, breathing exercises completed."
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleAppendSheetRow}
                        disabled={!sheetNote.trim() || sheetLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        {sheetLoading ? 'Saving...' : 'Add ROW Backup Entry'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dashboard visualization representation right */}
                <div className="bg-slate-950/40 p-6 border border-slate-800 rounded-[2rem] flex flex-col justify-between h-full min-h-[220px]">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logs Synced Sheets Structure</p>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">Column A:</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Timestamp (Date/Time)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">Column B:</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Sober Days Log Record</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-900/60 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-bold">Column C:</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Self Assessment Reflections</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 leading-normal border-t border-slate-900/60 pt-3 uppercase">
                    Backups securely written to Spokane Logs inside your personalized Google Drive storage safely.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT - GMAIL & CONTACTS HELPERS */}
          {activeTab === 'gmail' && (
            <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 bg-violet-500/10 rounded-2xl text-violet-500 border border-violet-500/10">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Gmail & Contacts Circles</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Email progress updates directly to personal Google Contacts buddies</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* GMAIL SEND PANEL */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Compose Update Email</h4>

                  <div className="space-y-3.5">
                    
                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 font-bold uppercase">Recipient Email</label>
                      <input 
                        type="email"
                        placeholder="support-peer@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white placeholder-slate-700 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 font-bold uppercase">Email Subject</label>
                      <input 
                        type="text"
                        value={gmailSubject}
                        onChange={(e) => setGmailSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] text-slate-500 font-bold uppercase">Body Message</label>
                      <textarea 
                        rows={4}
                        value={gmailMessage}
                        onChange={(e) => setGmailMessage(e.target.value)}
                        className="w-full p-3 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white leading-relaxed focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={handleSendGmail}
                      disabled={(!recipientEmail.trim() && !selectedContact) || gmailLoading}
                      className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {gmailLoading ? 'Sending...' : 'Transmit secure update message'}
                    </button>

                  </div>
                </div>

                {/* CONTACTS LIST SELECTION DROP DOWN */}
                <div className="bg-slate-950/40 p-5 border border-slate-800 rounded-[2rem] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select From Google Contacts</h4>
                      <button 
                        onClick={() => fetchContacts(token)}
                        className="text-[8px] font-make font-black text-slate-500 uppercase flex items-center gap-0.5"
                      >
                        <RefreshCw size={8} /> Reload Contacts
                      </button>
                    </div>

                    {contactsLoading ? (
                      <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase">
                        Accessing Google Contacts Connections...
                      </div>
                    ) : contacts.length > 0 ? (
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                        {contacts.map((c, i) => {
                          const name = c.names?.[0]?.displayName || c.names?.[0]?.formattedName || 'Anonymous Contact';
                          const email = c.emailAddresses?.[0]?.value || '';
                          return (
                            <div 
                              key={i}
                              onClick={() => {
                                if (email) {
                                  setRecipientEmail(email);
                                  setSelectedContact(email);
                                  setSuccessMsg(`Selected Contact: ${name}`);
                                  setTimeout(() => setSuccessMsg(''), 2000);
                                } else {
                                  setErrorMsg('This contact has no email configured.');
                                  setTimeout(() => setErrorMsg(''), 2000);
                                }
                              }}
                              className={`p-3 border rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                recipientEmail === email 
                                  ? 'bg-violet-500/10 border-violet-500/30' 
                                  : 'bg-slate-950 border-slate-900 hover:bg-slate-910'
                              }`}
                            >
                              <div>
                                <p className="text-[10px] font-black text-white leading-none">{name}</p>
                                <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{email || 'No email saved'}</p>
                              </div>
                              <span className="p-1 px-2 bg-slate-900 text-[8px] rounded-md font-bold uppercase tracking-wider text-slate-400">
                                Select
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-600 text-[10px] font-bold uppercase">
                        No Google Contacts found with email profiles.
                      </div>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-500 leading-normal border-t border-slate-900/60 pt-3 uppercase">
                    Select any support buddy above to load their email instantly.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT - GOOGLE MEET SESSION SCHEDULER */}
          {activeTab === 'meet' && (
            <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 bg-pink-500/10 rounded-2xl text-pink-500 border border-pink-500/10">
                  <Video size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Meet Instant Support Circles</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Spontaneous peer check-in videocalls backed by Google Calendar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Launch Secure Reflection session</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Establish an instant video meeting using Google Meet! Schedule the slot on your calendar and dispatch session links directly to support coordinators.
                    </p>
                  </div>

                  {!meetLink ? (
                    <button
                      onClick={handleCreateMeetRoom}
                      disabled={meetLoading}
                      className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-905/30 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                    >
                      {meetLoading ? (
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>
                          <Video size={16} /> Generate Live Meet Session Link
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="bg-slate-950 p-4 border border-rose-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between text-[8px] font-black text-rose-500 uppercase tracking-widest">
                        <span>Workspace Google Meet session Ready</span>
                        <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-bold truncate leading-relaxed">{meetLink}</p>
                      
                      <div className="flex gap-2 pt-1">
                        <a 
                          href={meetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white text-center rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                        >
                          Join Now! <ExternalLink size={10} />
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(meetLink);
                            setSuccessMsg('Meet url copied to clipboard!');
                            setTimeout(() => setSuccessMsg(''), 3000);
                          }}
                          className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl transition-all border border-slate-800"
                        >
                          <Clipboard size={14} />
                        </button>
                      </div>

                      <button 
                        onClick={() => setMeetLink('')}
                        className="w-full text-center py-2 text-[9px] text-slate-500 font-bold uppercase transition-colors hover:text-slate-400"
                      >
                        Reset Meeting room
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/40 p-6 border border-slate-800 rounded-[2rem] flex flex-col justify-between min-h-[180px]">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Session Guidelines</p>
                    <ul className="text-[11px] text-slate-400 leading-relaxed font-semibold space-y-2 list-disc pl-4">
                      <li>Use video calling when sharing milestones with clean-sober buddies.</li>
                      <li>Check-in daily with a mentor during the critical first 90 days.</li>
                      <li>Encourage honest, safe, non-judgmental expressions.</li>
                    </ul>
                  </div>

                  <p className="text-[8px] text-slate-550 leading-normal border-t border-slate-900/60 pt-3 uppercase">
                    Creates an official Calendar entry matching Spokane Recovery Support circle.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT - GOOGLE SLIDES CELEBRATION PRESENTATION */}
          {activeTab === 'slides' && (
            <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/10">
                  <Presentation size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Google Slides Celebration Story</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Celebrate your sobriety milestones using professional Google Slides presentation templates</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Actions Panel */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Connect Milestone Slide Deck</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Design a beautiful presentations story deck in your Google Drive folder! Display your progress stats, daily sobriety timelines, and recovery wins directly on slides to share with sponsors or support groups.
                    </p>

                    {!presentationId ? (
                      <button
                        onClick={handleCreateCelebrationPresentation}
                        disabled={slidesLoading}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {slidesLoading ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <>
                            <Plus size={15} /> Create "My Sobriety Celebration Story" Deck
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                          <div className="truncate">
                            <p className="text-[8px] font-black text-amber-500 uppercase tracking-wider">Active Workspace Slideshow</p>
                            <p className="text-xs font-bold text-white truncate">Sobriety Celebration Story</p>
                          </div>
                          <a 
                            href={presentationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 border border-slate-800 transition-all"
                          >
                            Open Deck <ExternalLink size={10} />
                          </a>
                        </div>
                        
                        <button
                          onClick={() => {
                            const conf = window.confirm("Are you sure you want to deploy a brand new presentation slides file? Your current link will be updated.");
                            if (conf) handleCreateCelebrationPresentation();
                          }}
                          className="w-full py-2 bg-transparent hover:bg-slate-800/40 text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest rounded-lg transition-all border border-dashed border-slate-800"
                        >
                          Generate New Slide Deck
                        </button>
                      </div>
                    )}
                  </div>

                  {presentationId && (
                    <div className="bg-slate-950/45 p-4 border border-slate-900 rounded-2xl space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">Interactive Slides Slideshow Preview</h4>
                      <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                        Preview of embedded slide deck matching ID: <span className="text-slate-400 font-mono select-all font-bold">{presentationId}</span>. Google Slides allow embedding directly.
                      </p>
                      
                      {/* Embed slide preview iframe */}
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                        <iframe
                          src={`https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`}
                          width="100%"
                          height="100%"
                          allowFullScreen={true}
                          className="border-none w-full h-full"
                          title="Recovery Slides Embed Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side slideshow explorer */}
                <div className="bg-slate-955 bg-slate-950/40 p-5 border border-slate-800 rounded-[2rem] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">My Slides Decks</h4>
                      <button 
                        onClick={() => fetchPresentations(token!)}
                        className="text-[8px] font-black text-slate-500 hover:text-slate-300 uppercase flex items-center gap-0.5"
                      >
                        <RefreshCw size={8} /> Reload presentations
                      </button>
                    </div>

                    {presentationsList.length > 0 ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {presentationsList.map((pres, idx) => (
                          <div 
                            key={pres.id || idx}
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${
                              presentationId === pres.id 
                                ? 'bg-amber-500/10 border-amber-500/30' 
                                : 'bg-slate-950 border-slate-900 hover:bg-slate-910'
                            }`}
                          >
                            <div className="truncate w-1/2">
                              <p className="text-[10px] font-black text-white leading-none truncate">{pres.name}</p>
                              <p className="text-[8px] text-slate-500 truncate font-mono mt-1">ID: {pres.id}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setPresentationId(pres.id);
                                  setPresentationUrl(pres.webViewLink);
                                  localStorage.setItem('myrecovery_saved_slides_id', pres.id);
                                  localStorage.setItem('myrecovery_saved_slides_url', pres.webViewLink);
                                  setSuccessMsg(`Switched to slideshow deck!`);
                                }}
                                className="px-2 py-1 bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md text-[8px] font-black uppercase tracking-wider border border-slate-800"
                              >
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        No sobriety slideshow presentations found in Drive
                      </div>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-500 leading-normal border-t border-slate-900/60 pt-3 uppercase">
                    Creates fully stylized title slides, stats tables, and reflection summaries automatically.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* 🔮 GOOGLE PICKER COMPANION MODAL INTERACTIVE SANDBOX */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl shadow-blue-950/20"
          >
            {/* Picker Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/10">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Picker Companion</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Pick and bind files directly from your workspace Drive</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-black transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Picker Controls */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/10 space-y-3.5">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Query folder / files name in Drive..."
                  value={pickerSearchQuery}
                  onChange={(e) => {
                    setPickerSearchQuery(e.target.value);
                    if (token) fetchPickerFiles(token, e.target.value, pickerFilter);
                  }}
                  className="flex-grow bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={() => {
                    if (token) fetchPickerFiles(token, pickerSearchQuery, pickerFilter);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Type Category Badges */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { tag: 'all', label: 'All Files 📂' },
                  { tag: 'slides', label: 'Slides 📊' },
                  { tag: 'docs', label: 'Docs 📝' },
                  { tag: 'sheets', label: 'Sheets 📈' },
                  { tag: 'forms', label: 'Forms 📋' }
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => {
                      setPickerFilter(item.tag as any);
                      if (token) fetchPickerFiles(token, pickerSearchQuery, item.tag);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap cursor-pointer ${
                      pickerFilter === item.tag 
                        ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Picker Content List */}
            <div className="flex-grow p-6 overflow-y-auto bg-slate-950/20">
              {pickerLoading ? (
                <div className="py-24 text-center text-slate-500 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
                  <span className="animate-spin inline-block w-8 h-8 border-4 border-slate-800 border-t-blue-500 rounded-full" />
                  Analyzing Drive files matching current request...
                </div>
              ) : pickerFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pickerFiles.map((file, i) => {
                    const isSlides = file.mimeType?.includes('presentation');
                    const isDoc = file.mimeType?.includes('document');
                    const isSheet = file.mimeType?.includes('spreadsheet');
                    const isForm = file.mimeType?.includes('form');
                    
                    let mimeBadgeColor = 'bg-slate-800 text-slate-400';
                    let mimeLabel = 'File';
                    if (isSlides) { mimeBadgeColor = 'bg-amber-600/10 text-amber-500 border border-amber-500/20'; mimeLabel = 'Slides'; }
                    else if (isDoc) { mimeBadgeColor = 'bg-blue-600/10 text-blue-400 border border-blue-500/20'; mimeLabel = 'Doc'; }
                    else if (isSheet) { mimeBadgeColor = 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'; mimeLabel = 'Sheet'; }
                    else if (isForm) { mimeBadgeColor = 'bg-violet-600/10 text-violet-400 border border-violet-500/20'; mimeLabel = 'Form'; }

                    return (
                      <div 
                        key={file.id || i}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4 hover:border-blue-500/40 hover:bg-slate-900 transition-all group"
                      >
                        <div className="space-y-1 truncate">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${mimeBadgeColor}`}>
                              {mimeLabel}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold truncate">ID: {file.id.slice(0, 10)}...</span>
                          </div>
                          <h4 className="text-[11px] font-bold text-white group-hover:text-blue-400 transition-colors truncate">{file.name}</h4>
                        </div>

                        <div className="flex gap-2 border-t border-slate-900/40 pt-2">
                          <button
                            onClick={() => handlePickFile(file)}
                            className="flex-grow py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Pick Selected
                          </button>
                          <a 
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-center border border-slate-800"
                            title="Open file directly in Google Drive"
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-24 text-center space-y-3">
                  <FolderOpen className="text-slate-705 mx-auto" size={40} />
                  <p className="text-xs text-slate-500 italic font-semibold">No workspace documents found in Google Drive files list.</p>
                </div>
              )}
            </div>

            {/* Picker Footer */}
            <div className="p-5 border-t border-slate-800 bg-slate-950/40 text-[9px] text-slate-500 text-center font-bold uppercase tracking-widest font-mono">
              Google Workspace Picker Suite - 100% Client-Side Sandbox Integration
            </div>
          </motion.div>
        </div>
      )}

      {/* GOOGLE OAUTH CONSENT REQUIREMENTS PANEL */}
      <div id="google-oauth-consent-panel" className="bg-slate-900/40 p-8 rounded-[3rem] border border-slate-800 space-y-6 mt-8">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/10">
            <Globe size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Google OAuth Consent & Verified Links Center</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Required URL Assets for Google Verification</p>
          </div>
        </div>

        <p className="text-slate-400 text-xs font-semibold leading-relaxed">
          Google only allows OAuth applications to request sensitive scopes (such as Google Chat and Documents) when configured with verified application directories, privacy policy guidelines, and Authorized Domains. Use these copyable parameters inside the <span className="text-blue-400 font-bold">Google Cloud Console &gt; APIs & Services &gt; OAuth Consent Screen</span> to protect your users and satisfy Google’s policies:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Left Column: Essential Links */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Application Home Page</span>
                <span className="text-[9px] text-slate-500 font-mono italic">App Local Target</span>
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app'}
                  className="text-white bg-slate-950 p-2.5 rounded-xl border border-slate-800 truncate flex-1 text-[11px] font-mono leading-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app';
                    navigator.clipboard.writeText(val);
                    setCopiedField('homepage');
                    setTimeout(() => setCopiedField(null), 2500);
                  }}
                  className="px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap min-w-[85px] text-center"
                >
                  {copiedField === 'homepage' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Application Privacy Policy Link</span>
                <button 
                  onClick={() => setShowPrivacyModal(true)}
                  className="text-[9px] text-blue-400 hover:underline font-bold uppercase transition-all cursor-pointer"
                >
                  Preview Text
                </button>
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/#/privacy` : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app/#/privacy'}
                  className="text-white bg-slate-950 p-2.5 rounded-xl border border-slate-800 truncate flex-1 text-[11px] font-mono leading-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = typeof window !== 'undefined' ? `${window.location.origin}/#/privacy` : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app/#/privacy';
                    navigator.clipboard.writeText(val);
                    setCopiedField('privacy');
                    setTimeout(() => setCopiedField(null), 2500);
                  }}
                  className="px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap min-w-[85px] text-center"
                >
                  {copiedField === 'privacy' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Application Terms of Service Link</span>
                <button 
                  onClick={() => setShowTermsModal(true)}
                  className="text-[9px] text-blue-400 hover:underline font-bold uppercase transition-all cursor-pointer"
                >
                  Preview Text
                </button>
              </label>
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/#/terms` : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app/#/terms'}
                  className="text-white bg-slate-950 p-2.5 rounded-xl border border-slate-800 truncate flex-1 text-[11px] font-mono leading-none focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = typeof window !== 'undefined' ? `${window.location.origin}/#/terms` : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app/#/terms';
                    navigator.clipboard.writeText(val);
                    setCopiedField('terms');
                    setTimeout(() => setCopiedField(null), 2500);
                  }}
                  className="px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap min-w-[85px] text-center"
                >
                  {copiedField === 'terms' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Authorized Domains & Steps */}
          <div className="p-5 bg-slate-950 hover:bg-slate-950/80 transition-all rounded-[2rem] border border-slate-850 space-y-4">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-sans leading-none">
              <ShieldCheck size={14} className="mt-0.5" />
              <span>Authorized Domains Registry</span>
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Google OAuth security constraints restrict login redirects and APIs to approved domains. Register these domains in your GCP credentials to prevent error screens:
            </p>
            <div className="space-y-2 font-mono text-[10.5px]">
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-850">
                <span className="text-slate-300 truncate mr-2">{typeof window !== 'undefined' ? window.location.hostname : 'ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app'}</span>
                <button 
                  onClick={() => {
                    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app';
                    navigator.clipboard.writeText(hostname);
                    setCopiedField('domain1');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="text-blue-400 text-[9px] uppercase font-black hover:underline tracking-wider shrink-0"
                >
                  {copiedField === 'domain1' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-850">
                <span className="text-slate-300">firebaseapp.com</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText('firebaseapp.com');
                    setCopiedField('domain2');
                    setTimeout(() => setCopiedField(null), 2000);
                  }}
                  className="text-blue-400 text-[9px] uppercase font-black hover:underline tracking-wider shrink-0"
                >
                  {copiedField === 'domain2' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Verification status: Adding these URLs guarantees that downstream OAuth consent dialogues compile cleanly without triggering domain verification flags.
            </p>
          </div>
        </div>
      </div>

      {/* PRIVACY POLICY DIALOG MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-6 shadow-2xl relative scrollbar-none"
          >
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Legal Policy Directory</span>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Privacy Policy – myRecovery</h3>
              <p className="text-[11px] text-slate-500 font-bold font-mono">Last updated: May 24, 2026</p>
            </div>

            <div className="space-y-4 text-xs text-slate-350 leading-relaxed font-sans font-medium">
              <p className="font-bold underline text-white">1. Information We Collect</p>
              <p>
                myRecovery Spokane is designed to protect your anonymity. We collect basic account credentials via your chosen OAuth Provider (e.g. Google) solely to synchronize your sobriety checklist, recovery backup worksheets, and Google Chat circular coordinates. We never sell, transmit, or license your personal information.
              </p>

              <p className="font-bold underline text-white">2. Scope Connection & Google User Data</p>
              <p>
                When you choose to authenticate your Google Account, our client connects directly to Google services. We utilize the chat and calendar scopes only with user authorization to publish updates or backup checklists. Google data is never parsed or archived on our backend databases.
              </p>

              <p className="font-bold underline text-white">3. Third-party APIs & Sound Services</p>
              <p>
                All local GPS feeds remain strictly local and anonymized. Real-time diagnostic channels do not trace your IP address.
              </p>

              <p className="font-bold underline text-white">4. Your Control Options</p>
              <p>
                You may at any time revoke permissions in your Google account settings or wipe local persistent databases instantly by clearing App data inside your browser settings tray.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* TERMS OF SERVICE DIALOG MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-6 shadow-2xl relative scrollbar-none"
          >
            <button 
              onClick={() => setShowTermsModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Legal Policy Directory</span>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Terms of Service – myRecovery</h3>
              <p className="text-[11px] text-slate-500 font-bold font-mono">Last updated: May 24, 2026</p>
            </div>

            <div className="space-y-4 text-xs text-slate-350 leading-relaxed font-sans font-medium">
              <p className="font-bold underline text-white">1. Acceptance of Terms</p>
              <p>
                By using myRecovery Spokane, you acknowledge and agree to respect all group community rules and treat all members with clean, supportive integrity. This application is a prototype intended solely for sobriety peer-support and wellness assistance.
              </p>

              <p className="font-bold underline text-white">2. Medical Disclaimer (Critical Information)</p>
              <p className="text-amber-400 font-semibold italic bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                ⚠️ IMPORTANT: THIS APPLICATION IS NOT A MEDICAL DISCOVERY TOOL, EMERGENCY TRIAGE SYSTEM, CLINICAL CLINIC, OR FORMAL DIAGNOSTIC DIAGNOSIS SUITE. If you are experiencing physiological distress, severe withdrawal symptoms, or crisis, please immediately utilize standard local professional hotlines (911 or local emergency services).
              </p>

              <p className="font-bold underline text-white">3. Third-party Google Access</p>
              <p>
                Users assume all responsibility for authorizing APIs inside our sandbox interface. We do not guarantee continuous uptime of intermediate Google API tokens.
              </p>

              <p className="font-bold underline text-white">4. Group Rules & Misconduct</p>
              <p>
                Harassment, clinical diagnostic assumptions, or advertising within group chat forums will result in immediate permanent block lists.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default WorkspaceIntegrations;
