import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, MessageSquare, FileText, Plus, Send, Check, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle, Share2, Clipboard, 
  AlertTriangle, Heart, Calendar, ArrowRight, Mail, Users, Video, Grid, HardDrive
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'daily' | 'drive' | 'gmail' | 'sheets' | 'meet'>('daily');

  // Google Tasks State
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);

  // Google Chat State
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Google Forms State
  const [generatedFormId, setGeneratedFormId] = useState<string>('');
  const [generatedFormUrl, setGeneratedFormUrl] = useState<string>('');
  const [formsLoading, setFormsLoading] = useState(false);
  const [formResponses, setFormResponses] = useState<any[]>([]);

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
    if (savedFormId) setGeneratedFormId(savedFormId);
    if (savedFormUrl) setGeneratedFormUrl(savedFormUrl);
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
    if (!token || !selectedSpaceId) return;
    const messageToSend = predefinedMessage || chatMessage;
    if (!messageToSend.trim()) return;

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
      setErrorMsg(error.message || 'Could not post to Google Chat');
    } finally {
      setChatLoading(false);
    }
  };


  // --- GOOGLE FORMS API ACTIONS ---

  const handleCreateWellnessForm = async () => {
    if (!token) return;
    setFormsLoading(true);
    setErrorMsg('');
    try {
      // Step A: Create standard Form
      const resCreate = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: 'myRecovery Reflections & Daily Check-In',
            documentTitle: 'myRecovery Daily Check-In'
          }
        })
      });
      if (!resCreate.ok) throw new Error('Failed to instantiate Form');
      const formObj = await resCreate.json();
      const formId = formObj.formId;
      const responderUri = formObj.responderUri;

      // Step B: Set up core recovery evaluation questions in a batch update
      const updateData = {
        requests: [
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
        ]
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
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Google Workspace Connected
              </span>
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
                <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-pink-500/10 rounded-2xl text-pink-500 border border-pink-500/10">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Chat Circle</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Support Room Broadcast</p>
                        </div>
                      </div>

                      {spaces.length > 0 && (
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
                      )}
                    </div>

                    <div className="space-y-3.5">
                      <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                        Announce milestone achievements or dispatch immediate support signals directly to your recovery circle space in Google Chat.
                      </p>

                      {spaces.length === 0 ? (
                        <div className="p-6 bg-slate-950/20 border border-slate-800/60 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            No Google Chat spaces found. Create a space in Google Chat to broadcast.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <div className="flex flex-wrap gap-2.5">
                            <button
                              onClick={() => handlePostToSpace(`🎉 myRecovery Milestone Checklist: ${userName} has reached ${daysSober} Days clean and sober today! Day by Day.`)}
                              disabled={chatLoading}
                              className="flex-1 min-w-[140px] p-3 text-left bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 rounded-xl flex items-center justify-between gap-1 transition-all cursor-pointer"
                            >
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-wider leading-none">Share Milestone</p>
                                <p className="text-[8px] text-slate-400 font-medium">Broadcast {daysSober} Days</p>
                              </div>
                              <Share2 size={12} />
                            </button>

                            <button
                              onClick={() => {
                                const conf = window.confirm("Are you sure you want to broadcast an SOS message to Google Chat? Your support forum will be notified instantly.");
                                if (conf) {
                                  handlePostToSpace(`🚨 [SOS SUPPORT CHECKIN]: This is an urgent check-in from ${userName} on their myRecovery app. They are seeking connection or support right now. Please reach out!`);
                                }
                              }}
                              disabled={chatLoading}
                              className="flex-1 min-w-[140px] p-3 text-left bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-500 rounded-xl flex items-center justify-between gap-1 transition-all cursor-pointer"
                            >
                              <div className="space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-wider leading-none">Send SOS Alert</p>
                                <p className="text-[8px] text-slate-400 font-medium">Instant Group Trigger</p>
                              </div>
                              <AlertTriangle size={12} className="text-rose-400 animate-pulse" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedSpaceId && spaces.length > 0 && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePostToSpace();
                      }} 
                      className="flex gap-2 bg-slate-950 border border-slate-800 p-1 rounded-2xl"
                    >
                      <input
                        type="text"
                        placeholder="Send a status update to Google Chat..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-grow bg-transparent px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!chatMessage.trim() || chatLoading}
                        className="px-4 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
                      >
                        Post message
                      </button>
                    </form>
                  )}
                </div>

              </div>

              {/* 3. GOOGLE FORMS REFLECTION GENERATOR */}
              <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-500/10 rounded-2xl text-violet-500 border border-violet-500/10">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Forms Wellness Checklist</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Automated Survey Reflections</p>
                    </div>
                  </div>

                  {generatedFormId && (
                    <button
                      onClick={() => fetchFormResponses(token, generatedFormId)}
                      disabled={formsLoading}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <RefreshCw size={10} className={formsLoading ? 'animate-spin' : ''} />
                      Fetch Responses
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                      Deploy a dedicated Google Check-In Form to evaluate craving levels, monitor well-being logs, and store structured reflection sheets directly in your Google Drive.
                    </p>

                    {!generatedFormId ? (
                      <button
                        onClick={handleCreateWellnessForm}
                        disabled={formsLoading}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {formsLoading ? (
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-violet-200 border-t-white rounded-full" />
                        ) : (
                          <>
                            <Plus size={16} /> Deploy Check-In Form
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex flex-col justify-between items-start gap-2">
                          <div className="w-full flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Form Active Link</span>
                            <span className="text-emerald-500 flex items-center gap-0.5">
                              <Check size={8} className="stroke-[3]" /> Live
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate w-full font-bold">{generatedFormUrl}</p>
                          
                          <div className="w-full flex gap-2 pt-1 border-t border-slate-800 mt-2">
                            <a 
                              href={generatedFormUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                            >
                              Fill Form <ExternalLink size={10} />
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generatedFormUrl);
                                setSuccessMsg('Form link copied to clipboard!');
                                setTimeout(() => setSuccessMsg(''), 3000);
                              }}
                              className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-xl transition-all border border-slate-800"
                            >
                              <Clipboard size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            const safetyConf = window.confirm("Are you sure you want to deploy a brand new evaluation form? This will orphan your existing dashboard links.");
                            if (safetyConf) {
                              handleCreateWellnessForm();
                            }
                          }}
                          className="w-full py-2 bg-transparent hover:bg-slate-800/40 text-[9px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest rounded-lg transition-all border border-dashed border-slate-800"
                        >
                          Regenerate New Form Setup
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LIVE FORM DASHBOARD FEED */}
                  <div className="bg-slate-950/40 p-5 border border-slate-800/80 rounded-[2rem] flex flex-col justify-between h-full min-h-[180px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Google Forms Status</span>
                        <span>{formResponses.length} Responses</span>
                      </div>

                      {generatedFormId ? (
                        formResponses.length > 0 ? (
                          <div className="space-y-3 max-h-[150px] overflow-y-auto pr-1">
                            {formResponses.slice(0, 3).map((resp, i) => {
                              const subTime = resp.lastSubmittedTime ? new Date(resp.lastSubmittedTime) : null;
                              return (
                                <div key={resp.responseId || i} className="p-3 bg-slate-900 border border-slate-800/40 rounded-xl space-y-1">
                                  <div className="flex justify-between items-center text-[8px] font-black text-slate-500">
                                    <span className="text-violet-400">Response #{formResponses.length - i}</span>
                                    <span>{subTime ? subTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                                    Completed Check-In evaluated from Google Forms.
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-6 text-center space-y-1">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-none">Awaiting Submissions</p>
                            <p className="text-[9px] text-slate-500 font-semibold max-w-[200px] mx-auto leading-relaxed pt-1">
                              No responses found in Google Forms yet. Click 'Fill Form' above and fill out a submission, then click 'Fetch Responses'.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="py-8 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                          Form is Inactive
                        </div>
                      )}
                    </div>

                    <div className="text-[8px] text-slate-500 font-bold leading-normal pt-2 border-t border-slate-900 uppercase">
                      Google Drive Form submissions will appear in this reflection history.
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

        </div>
      )}

    </div>
  );
};

export default WorkspaceIntegrations;
