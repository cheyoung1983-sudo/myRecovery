import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, MessageSquare, FileText, Plus, Send, Check, 
  ExternalLink, Sparkles, RefreshCw, AlertCircle, Share2, Clipboard, 
  AlertTriangle, Heart, Calendar, ArrowRight
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
    const savedFormId = localStorage.getItem('myrecovery_saved_form_id');
    if (savedFormId) {
      fetchFormResponses(activeToken, savedFormId);
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
                Google Work Workspace Active
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
            Authorize Google secure calendar alignments, interactive sobriety action lists, direct support circles, and custom wellness reflection forms with a single click.
          </p>
          <button
            onClick={handleConnect}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
          >
            Authenticate Google Workspace
          </button>
        </div>
      ) : (
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
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
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

          {/* 2. GOOGLE CHAT HOTLINE / STATUS SYNC */}
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

          {/* 3. GOOGLE FORMS REFLECTION GENERATOR */}
          <div className="lg:col-span-2 bg-slate-900/50 p-8 rounded-[3rem] border border-slate-800 space-y-6">
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
                            <div key={resp.responseId || i} className="p-3 bg-slate-905 border border-slate-800/40 rounded-xl space-y-1">
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

    </div>
  );
};
