import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Target, Award, Calendar as CalendarIcon, RotateCcw, 
  Plus, Trash2, AlertTriangle, Bell, Clock, BookOpen, 
  Zap, WifiOff, X, Filter, Edit3, BellOff, BellRing
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- CONFIGURATION ---
// 1. Deploy your Apps Script as a Web App
// 2. Paste the Web App URL below (or use .env.local)
const APPS_SCRIPT_URL =  import.meta.env.VITE_APPS_SCRIPT_URL || '';
// --- UTILITY FUNCTIONS ---

const getLocalStorage = (key, initial) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  } catch {
    return initial;
  }
};

const setLocalStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
};

function formatDate(dateString) {
  if (!dateString) return '';
  if (!dateString.includes('T') && !dateString.includes('-')) return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
  } catch { return dateString; }
}

function parseSheetData(data) {
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row, rowIndex) => {
    const obj = { rowIndex };
    headers.forEach((header, index) => obj[header] = row[index]);
    return obj;
  });
}

// --- SUB-COMPONENTS ---

// 1. TOAST NOTIFICATIONS
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div 
        key={toast.id} 
        className={`
          pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all transform animate-in slide-in-from-right border border-white/10
          ${toast.type === 'error' ? 'bg-red-900/90 text-red-100' : 
            toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-100' : 
            'bg-slate-800/90 text-slate-100'}
        `}
      >
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100"><X size={14} /></button>
      </div>
    ))}
  </div>
);

// 2. EDITABLE POMODORO TIMER
const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('25');

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (Notification.permission === "granted") new Notification("Timer Done!", { body: "Time to take a break!" });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setEditValue('25');
  };

  const handleTimeSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(editValue, 10);
    if (!isNaN(mins) && mins > 0) {
      setTimeLeft(mins * 60);
    }
    setIsEditing(false);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800/50 relative group">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Clock size={18} className="text-cyan-400" /> Focus Timer
        </h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-xs text-slate-500 hover:text-cyan-400 flex items-center gap-1">
            <Edit3 size={12} /> Edit
          </button>
        )}
      </div>
      
      <div className="text-center py-6">
        {isEditing ? (
          <form onSubmit={handleTimeSubmit} className="flex justify-center items-center gap-2">
            <input 
              type="number" 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-slate-800 text-white text-4xl font-mono w-24 text-center rounded-lg p-2 outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
            <span className="text-slate-400 text-xl">min</span>
            <button type="submit" className="bg-cyan-600 p-2 rounded-lg text-white hover:bg-cyan-500"><Check size={20}/></button>
          </form>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="text-6xl font-mono font-bold text-slate-100 tracking-wider cursor-pointer hover:text-cyan-200 transition-colors"
            title="Click to edit time"
          >
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button onClick={toggleTimer} className="px-8 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold transition-colors shadow-lg shadow-cyan-500/20">
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

// 3. INTERACTIVE CALENDAR WIDGET
const CalendarWidget = ({ dailyData, onDateSelect, selectedDate }) => {
  const today = new Date();
  const daysInMonth = 30; 
  const startDay = 6; 

  const getDayStatus = (dayNum) => {
    if (!dailyData) return 'none';
    const dayString = `Nov ${dayNum}`;
    const dayData = dailyData.find(d => d.Date && d.Date.includes(dayString));
    if (!dayData) return 'none';
    if (!dayData.IsStudyDay) return 'exam';
    if (dayData.Done) return 'done';
    return 'study';
  };

  const days = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - startDay + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return { 
      num: dayNum, 
      status: getDayStatus(dayNum),
      dateString: `Nov ${dayNum}`
    };
  });

  return (
    <div className="bg-slate-900 p-6 rounded-2xl mb-6 border border-slate-800/50">
       <div className="flex justify-between items-center mb-4">
         <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <CalendarIcon size={18} className="text-cyan-400" /> Schedule
         </h3>
         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nov 2025</span>
       </div>
       
       <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-500 font-medium">
         <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
       </div>
       <div className="grid grid-cols-7 gap-1">
         {days.map((day, idx) => (
           <button 
             key={idx} 
             onClick={() => day && onDateSelect(day.dateString)}
             disabled={!day || day.status === 'none'}
             className={`
               aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-all relative
               ${!day ? '' : 
                 day.status === 'exam' ? 'bg-amber-900/40 text-amber-200 border border-amber-700/30 hover:bg-amber-900/60' :
                 day.status === 'done' ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/30 hover:bg-emerald-900/60' :
                 day.status === 'study' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' :
                 'text-slate-600 cursor-default'
               }
               ${day && day.dateString === selectedDate ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 z-10' : ''}
             `}
           >
             {day ? day.num : ''}
             {day && day.num === today.getDate() && today.getMonth() === 10 && (
               <div className="absolute bottom-1 w-1 h-1 bg-cyan-400 rounded-full"></div>
             )}
           </button>
         ))}
       </div>
    </div>
  );
};

// 4. STATS DASHBOARD
const StatsDashboard = ({ dailyData, subjectData }) => {
  const completedDays = dailyData ? dailyData.filter(d => d.Done).length : 0;
  
  let totalTopics = 0;
  let completedTopics = 0;
  if (subjectData) {
    Object.values(subjectData).forEach(sheet => {
      if (Array.isArray(sheet)) {
          totalTopics += sheet.length;
          completedTopics += sheet.filter(i => i.Done).length;
      }
    });
  }
  const topicRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/50">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Completion Rate</div>
        <div className="text-3xl font-bold text-white">{topicRate}%</div>
        <div className="w-full h-1 bg-slate-800 mt-3 rounded-full overflow-hidden">
           <div className="h-full bg-cyan-500" style={{width: `${topicRate}%`}}></div>
        </div>
      </div>
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/50">
        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Study Streak</div>
        <div className="text-3xl font-bold text-white">{completedDays} <span className="text-sm text-slate-500 font-normal">days</span></div>
        <div className="text-xs text-emerald-400 font-medium mt-2">Keep consistent!</div>
      </div>
    </div>
  );
};

// 5. NOTES MODAL
const NoteButton = ({ id, notes, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(notes[id] || '');

  const handleSave = () => {
    onSave(id, text);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`p-1.5 rounded-lg transition-colors ${notes[id] ? 'text-cyan-300 bg-cyan-500/20' : 'text-slate-600 hover:text-slate-300'}`}
      >
        <BookOpen size={14} />
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-800">
            <h3 className="font-bold text-lg mb-4 text-white">Quick Note</h3>
            <textarea 
              className="w-full h-32 p-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-slate-200 text-sm resize-none placeholder-slate-600"
              placeholder="Add resources, tips, or thoughts..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-cyan-600 text-white rounded-lg hover:bg-cyan-500">Save Note</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- UI PRIMITIVES ---
const CustomCheckbox = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`
      w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200
      ${checked 
        ? 'bg-cyan-600 border-cyan-600 text-white scale-110 shadow-[0_0_10px_rgba(79,70,229,0.5)]' 
        : 'bg-slate-900 border-slate-700 hover:border-cyan-500 hover:shadow-[0_0_5px_rgba(6,182,212,0.3)]'
      }
      ${disabled ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}
    `}
    aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
  >
    {checked && <Check size={12} strokeWidth={3.5} />}
  </button>
);

const ErrorDisplay = ({ message }) => (
  <div className="p-6 bg-red-900/20 text-red-300 rounded-xl text-sm border border-red-800/30 mb-6">
    <h3 className="font-bold mb-1 flex items-center gap-2">
      <AlertTriangle size={16} />
      Error Loading Data
    </h3>
    <p>{message}</p>
    <p className="mt-2 text-xs opacity-50">Check your internet connection or API URL.</p>  
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
  </div>
);

// --- MAIN COMPONENT ---

export default function App() {
  const [allData, setAllData] = useState(null);
  const [status, setStatus] = useState('loading'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [notes, setNotes] = useState(() => getLocalStorage('s3_notes', {}));
  const [offlineQueue, setOfflineQueue] = useState(() => getLocalStorage('s3_queue', []));
  const [hourlyReminders, setHourlyReminders] = useState(() => getLocalStorage('s3_reminders', false)); // REMINDERS STATE
  
  const [currentView, setCurrentView] = useState('Daily_Plan');
  const [studyMode, setStudyMode] = useState(false); 
  const [toasts, setToasts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Actions
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleSaveNote = (id, text) => {
    const newNotes = { ...notes, [id]: text };
    setNotes(newNotes);
    setLocalStorage('s3_notes', newNotes);
    addToast('Note saved locally', 'success');
  };

  const handleDateSelect = (dateStr) => {
    if (selectedDate === dateStr) {
      setSelectedDate(null); // Toggle off
    } else {
      setSelectedDate(dateStr);
      setCurrentView('Daily_Plan'); // Switch view to show tasks
    }
  };

  // Toggle Reminders Logic
  const toggleHourlyReminders = () => {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
    }

    if (Notification.permission !== "granted") {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                setHourlyReminders(true);
                setLocalStorage('s3_reminders', true);
                addToast("Hourly reminders ON", "success");
                new Notification("S3 Tracker", { body: "Reminders enabled! We'll nudge you every hour." });
            }
        });
    } else {
        const newState = !hourlyReminders;
        setHourlyReminders(newState);
        setLocalStorage('s3_reminders', newState);
        addToast(`Hourly reminders ${newState ? 'ON' : 'OFF'}`, newState ? 'success' : 'info');
        if (newState) {
             new Notification("S3 Tracker", { body: "Reminders active! Let's get to work." });
        }
    }
  };

  // Reminder Interval Effect
  useEffect(() => {
      let interval;
      if (hourlyReminders) {
          // Set an interval for 60 minutes (3600000 ms)
          interval = setInterval(() => {
              if (Notification.permission === "granted") {
                  const msgs = [
                    "Time to lock in! 📚", 
                    "Keep the momentum going!", 
                    "One hour down. How's the progress?", 
                    "Don't break the streak! Focus time."
                  ];
                  const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
                  
                  new Notification("Study Check-in", {
                      body: randomMsg,
                      icon: '/icon.jpg', // Ensure icon.jpg is in public folder
                      silent: false
                  });
              }
          }, 3600000);
      }
      return () => clearInterval(interval);
  }, [hourlyReminders]);

  // Data Fetching & Sync
  const isOnline = useOnlineStatus();

  useEffect(() => {
    fetchData();
    if (isOnline && offlineQueue.length > 0) {
      processQueue();
    }
  }, [isOnline]);

  const fetchData = async () => {
    if (!APPS_SCRIPT_URL) return setStatus('error');
    setStatus('loading');
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      
      const parsedData = {};
      for (const sheetName in data) {
        parsedData[sheetName] = parseSheetData(data[sheetName]);
      }
      setAllData(parsedData);
      setStatus('loaded');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  const processQueue = async () => {
    addToast(`Syncing ${offlineQueue.length} changes...`, 'info');
    const newQueue = [...offlineQueue];
    
    while (newQueue.length > 0) {
      const item = newQueue[0];
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(item),
        });
        newQueue.shift(); 
      } catch (err) {
        console.error("Sync failed", err);
        break; 
      }
    }
    
    setOfflineQueue(newQueue);
    setLocalStorage('s3_queue', newQueue);
    if (newQueue.length === 0) {
      addToast('All changes synced!', 'success');
      fetchData(); 
    }
  };

  const updateSheet = async (payload, optimisticUpdate) => {
    optimisticUpdate();
    
    // Instant Confetti on Check
    if (payload.action === 'toggleCheckbox' && payload.value === true) {
       confetti({ 
         particleCount: 150, 
         spread: 60, 
         origin: { y: 0.7 },
         colors: ['#06b6d4', '#3b82f6', '#6366f1'],
         disableForReducedMotion: true
       });
    }

    if (navigator.onLine) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error('Update failed', err);
        addToQueue(payload);
      }
    } else {
      addToQueue(payload);
    }
  };

  const addToQueue = (payload) => {
    const newQueue = [...offlineQueue, payload];
    setOfflineQueue(newQueue);
    setLocalStorage('s3_queue', newQueue);
    addToast('Saved offline. Syncing later.', 'warning');
  };

  // Handlers
  const handleToggle = (sheetName, rowIndex, newValue) => {
    updateSheet(
      { action: 'toggleCheckbox', sheetName, rowIndex, value: newValue },
      () => {
        setAllData(prev => {
          const newData = [...prev[sheetName]];
          const idx = newData.findIndex(i => i.rowIndex === rowIndex);
          if (idx > -1) newData[idx] = { ...newData[idx], Done: newValue };
          return { ...prev, [sheetName]: newData };
        });
      }
    );
  };

  const handleAddTopic = (sheetName, moduleNum, topicName) => {
    updateSheet(
      { action: 'addTopic', sheetName, moduleNum, topicName },
      () => addToast('Adding topic...', 'info') 
    );
    setTimeout(fetchData, 1000);
  };

  const handleDeleteTopic = (sheetName, rowIndex) => {
    if (!window.confirm("Delete?")) return;
    updateSheet(
      { action: 'deleteTopic', sheetName, rowIndex },
      () => {
        setAllData(prev => {
          const newData = prev[sheetName].filter(i => i.rowIndex !== rowIndex);
          return { ...prev, [sheetName]: newData };
        });
      }
    );
  };

  // Force Dark Mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Request Notification Permission
  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      new Notification("S3 Tracker", { body: "Notifications are active! Time to focus." });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("S3 Tracker", { body: "You're set! We'll keep you on track." });
        }
      });
    }
  };

  // View Filtering (Study Mode + Date Filter + Sorting)
  const getFilteredData = () => {
    if (!allData || !currentView || !allData[currentView]) return [];
    
    let processedData = allData[currentView];

    // 1. Date Filter (Only for Daily Plan)
    if (currentView === 'Daily_Plan' && selectedDate) {
      processedData = processedData.filter(item => item.Date && item.Date.includes(selectedDate));
    }

    // 2. Study Mode (Hide completed)
    if (studyMode) {
      processedData = processedData.filter(item => !item.Done);
    }

    // 3. Sort: Incomplete top, Complete bottom
    // (We assume sub-components handle more complex grouping, this just pre-sorts the array they receive)
    return processedData; 
  };

  const viewData = getFilteredData();
  const subjectSheets = allData ? Object.keys(allData).filter(name => name.endsWith('_Tracker')) : [];

  // Sort Subject Tabs: Completed last
  const sortedSubjectSheets = useMemo(() => {
    if (!allData) return [];
    const sheets = Object.keys(allData).filter(name => name.endsWith('_Tracker'));
    return sheets.sort((a, b) => {
      const aItems = allData[a];
      const bItems = allData[b];
      const aComplete = aItems.length > 0 && aItems.every(i => i.Done);
      const bComplete = bItems.length > 0 && bItems.every(i => i.Done);
      // Incomplete (0) -> Complete (1)
      return Number(aComplete) - Number(bComplete);
    });
  }, [allData]);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-cyan-500/30">
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(p => p.filter(t => t.id !== id))} />
      
      <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="flex justify-between items-end mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              S3 Comeback
              {!isOnline && <WifiOff size={16} className="text-amber-500 animate-pulse" />}
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">November 2025</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-full shadow-lg shadow-slate-950/50 border border-slate-800">
             <button 
               onClick={toggleHourlyReminders}
               className={`p-2 transition-colors rounded-full ${hourlyReminders ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-slate-200'}`}
               title={hourlyReminders ? "Disable Hourly Reminders" : "Enable Hourly Reminders"}
             >
               {hourlyReminders ? <BellRing size={18} /> : <BellOff size={18} />}
             </button>
            <button onClick={() => setStudyMode(!studyMode)} className={`p-2 transition-colors rounded-full ${studyMode ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-slate-200'}`} title="Focus Mode">
              <Zap size={18} fill={studyMode ? "currentColor" : "none"} />
            </button>
            <button onClick={fetchData} className={`p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full ${status === 'loading' ? 'animate-spin' : ''}`}>
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-grow">
          {status === 'error' && <ErrorDisplay message={errorMessage} />}
          
          {allData && (
            <>
              {/* TABS */}
              <div className="mb-8 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 flex gap-2">
                 <button
                    onClick={() => { setCurrentView('Daily_Plan'); setSelectedDate(null); }}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                      currentView === 'Daily_Plan' ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Daily Plan
                  </button>
                  <button
                    onClick={() => setCurrentView('Dashboard')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                      currentView === 'Dashboard' ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  {sortedSubjectSheets.map(sheet => (
                    <button
                      key={sheet}
                      onClick={() => setCurrentView(sheet)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${
                        currentView === sheet ? 'bg-cyan-600 text-white border-cyan-600 shadow-lg shadow-cyan-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {sheet.replace('_Tracker', '')}
                    </button>
                  ))}
              </div>

              {/* FILTER BANNER */}
              {currentView === 'Daily_Plan' && selectedDate && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg mb-6 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Filter size={14} />
                    Filtered: <span className="font-bold">{selectedDate}</span>
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="hover:text-white hover:bg-cyan-500/20 p-1 rounded"><X size={14}/></button>
                </div>
              )}

              {/* VIEWS */}
              {currentView === 'Dashboard' ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <StatsDashboard dailyData={allData.Daily_Plan} subjectData={allData} />
                    <PomodoroTimer />
                    <CalendarWidget dailyData={allData.Daily_Plan} onDateSelect={handleDateSelect} selectedDate={selectedDate} />
                 </div>
              ) : currentView === 'Daily_Plan' ? (
                <DailyPlanView 
                  data={viewData} 
                  onToggle={(rowIndex, val) => handleToggle('Daily_Plan', rowIndex, val)}
                  studyMode={studyMode}
                />
              ) : (
                <SubjectTrackerView 
                  sheetName={currentView}
                  data={viewData} 
                  onToggle={(rowIndex, val) => handleToggle(currentView, rowIndex, val)}
                  onAddTopic={handleAddTopic}
                  onDeleteTopic={handleDeleteTopic}
                  notes={notes}
                  onSaveNote={handleSaveNote}
                  studyMode={studyMode}
                />
              )}
            </>
          )}
        </main>

        <footer className="mt-12 py-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-600 font-medium">
            Stay focused. You got this.
          </p>
        </footer>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS (VIEW LOGIC) ---

const DailyPlanView = ({ data, onToggle, studyMode }) => {
  const phases = [{ num: 1, title: 'Phase 1', icon: <Target size={18} /> }, { num: 2, title: 'Phase 2', icon: <CalendarIcon size={18} /> }, { num: 3, title: 'Phase 3', icon: <Award size={18} /> }];
  
  // Sort Phases: Completed ones to bottom
  const sortedPhases = [...phases].sort((a, b) => {
    const getCompletion = (phaseNum) => {
        const items = data.filter(i => i.Phase === phaseNum);
        // Only count items that are actual study sessions (IsStudyDay = true)
        const studyItems = items.filter(i => i.IsStudyDay);
        // A phase is complete if all its study items are Done.
        return studyItems.length > 0 && studyItems.every(i => i.Done) ? 1 : 0;
    };
    
    return getCompletion(a.num) - getCompletion(b.num);
  });

  return (
    <div className="space-y-8 pb-20">
      {sortedPhases.map(phase => {
        let phaseItems = data.filter(i => i.Phase === phase.num);
        
        // If filtered by date, we might get 0 items for a phase. Hide it.
        if (phaseItems.length === 0) return null;

        // Check if this visible subset is complete (ignoring exams)
        const studyItems = phaseItems.filter(i => i.IsStudyDay);
        const isComplete = studyItems.length > 0 && studyItems.every(i => i.Done);
        
        // Sort Items: Done last
        phaseItems.sort((a, b) => Number(a.Done) - Number(b.Done));

        return (
          <div key={phase.num} className={`transition-all duration-500 ${isComplete ? 'opacity-40 order-last' : ''}`}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-200">
              <span className="p-2 bg-slate-900 rounded-lg text-cyan-400">{phase.icon}</span> 
              {phase.title}
            </h3>
            <div className="space-y-2">
              {phaseItems.map(item => {
                 const isExamDay = !item.IsStudyDay;
                 return (
                   <div key={item.rowIndex} className={`
                      flex gap-3 p-4 rounded-xl border transition-all group items-start
                      ${!item.IsStudyDay 
                         ? 'bg-amber-950/20 border-amber-900/50' 
                         : item.Done 
                            ? 'bg-slate-900/30 border-transparent' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }
                   `}>
                     <div className="mt-0.5">
                        {isExamDay ? <AlertTriangle size={16} className="text-amber-500" /> : (
                          <CustomCheckbox checked={item.Done} onChange={() => onToggle(item.rowIndex, !item.Done)} disabled={!item.IsStudyDay} />
                        )}
                     </div>
                     <div className="flex-grow">
                       <div className="flex justify-between items-start mb-1">
                          <span className={`font-bold text-sm ${item.Done ? 'line-through text-slate-600' : isExamDay ? 'text-amber-200' : 'text-slate-200'}`}>{item.Subject}</span>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded whitespace-nowrap">
                            <CalendarIcon size={10} />
                            {formatDate(item.Date)}
                          </div>
                       </div>
                       <div className={`text-xs ${item.Done ? 'text-slate-700' : isExamDay ? 'text-amber-500/70' : 'text-slate-500'}`}>{item['Module(s) Focus']}</div>
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SubjectTrackerView = ({ sheetName, data, onToggle, onAddTopic, onDeleteTopic, notes, onSaveNote, studyMode }) => {
  const modules = [...new Set(data.map(i => i.Module))].sort((a, b) => a - b);

  // Sort Modules: Completed last
  const sortedModules = [...modules].sort((a, b) => {
     const aItems = data.filter(i => i.Module === a);
     const bItems = data.filter(i => i.Module === b);
     // Note: Checking completion on 'data' (which might be filtered by studyMode)
     const aComplete = aItems.length > 0 && aItems.every(i => i.Done);
     const bComplete = bItems.length > 0 && bItems.every(i => i.Done);
     return Number(aComplete) - Number(bComplete);
  });

  return (
    <div className="space-y-8 pb-20">
      {sortedModules.map(mod => {
        let moduleItems = data.filter(i => i.Module === mod);
        
        if (moduleItems.length === 0) return null; // Don't show empty modules (e.g. if hidden by study mode)
        
        const isComplete = moduleItems.every(i => i.Done);
        
        // Sort items: Done last
        moduleItems.sort((a, b) => Number(a.Done) - Number(b.Done));

        return (
          <div key={mod} className={`transition-all duration-500 ${isComplete ? 'opacity-40 order-last grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-2 px-1">
               <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Module {mod}</span>
               {isComplete && <Check size={14} className="text-cyan-500" />}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
              {moduleItems.map(item => (
                <div key={item.rowIndex} className={`group flex items-start gap-3 p-3 transition-colors ${item.Done ? 'bg-slate-900/50' : 'hover:bg-slate-800/50'}`}>
                  <div className="mt-0.5"><CustomCheckbox checked={item.Done} onChange={() => onToggle(item.rowIndex, !item.Done)} /></div>
                  <span className={`flex-grow text-sm leading-relaxed ${item.Done ? 'line-through text-slate-600' : 'text-slate-300'}`}>{item.Topic}</span>
                  <NoteButton id={`${sheetName}-${item.rowIndex}`} notes={notes} onSave={onSaveNote} />
                  <button onClick={() => onDeleteTopic(sheetName, item.rowIndex)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </div>
              ))}
              <div className="p-2 bg-slate-950/30">
                 <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                   <Plus size={16} className="text-slate-500" />
                   <input className="flex-grow bg-transparent text-sm py-1 outline-none text-slate-300 placeholder-slate-600" placeholder="Add topic..." onKeyDown={(e) => {
                     if(e.key === 'Enter') { onAddTopic(sheetName, mod, e.target.value); e.target.value = ''; }
                   }} />
                 </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Custom hook for online status
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}