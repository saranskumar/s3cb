import React, { useState, useEffect, useMemo } from 'react';
import { Check, Circle, Zap, Calendar, RotateCcw, Target, Award, Moon, Sun, ChevronsDown, ChevronsUp, LayoutGrid, List, Plus } from 'lucide-react'; // Added 'Plus' icon

// --- IMPORTANT ---
// 1. Deploy your Apps Script as a Web App (see instructions)
// 2. Paste the Web App URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTNum6B6SCfNH0rjA_kRaGXzgOSIb_Ior-mWlg3KaCJhVoxuo2e_xifgXk9fKS4j3e/exec';

// --- Utility Functions ---

/**
 * Parses the 2D array from Google Sheets into a more usable array of objects.
 * Assumes the first row is headers.
 */
function parseSheetData(data) {
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row, rowIndex) => {
    const obj = { 
      // Add a stable rowIndex for updates, 0-based for the data rows
      rowIndex: rowIndex 
    };
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// --- UI Components ---

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="p-6 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
    <h3 className="font-bold">Error Loading Data</h3>
    <p>{message}</p>
    <p className="mt-2 text-sm">Please check your `APPS_SCRIPT_URL` and ensure the script is deployed correctly.</p>  
  </div>
);

const CustomCheckbox = ({ checked, onChange, disabled = false }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
      checked
        ? 'bg-green-500 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
    aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
  >
    {checked && <Check size={16} />}
  </button>
);

const ProgressBar = ({ value }) => {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
      <div
        className="h-4 bg-green-500 transition-all duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// --- NEW COMPONENT ---
/**
 * A form to add a new topic to a specific module.
 */
const AddTopicForm = ({ moduleNum, sheetName, onAddTopic, isAddingTopic }) => {
  const [topicName, setTopicName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topicName.trim() || isAddingTopic) return;
    
    onAddTopic(sheetName, moduleNum, topicName.trim());
    setTopicName(''); // Clear input after submission
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
        placeholder="Add new topic..."
        className="flex-grow px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        disabled={isAddingTopic}
      />
      <button
        type="submit"
        className="flex-shrink-0 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        disabled={isAddingTopic || !topicName.trim()}
        aria-label="Add topic"
      >
        <Plus size={16} />
      </button>
    </form>
  );
};


// --- View Components ---

/**
 * Renders the Daily Plan view
 */
const DailyPlanView = ({ data, onToggle, isUpdating }) => {
  const totalStudyDays = data.filter(item => item.IsStudyDay).length;
  const completedStudyDays = data.filter(item => item.IsStudyDay && item.Done).length;
  const progressPercent = totalStudyDays > 0 ? (completedStudyDays / totalStudyDays) * 100 : 0;
  
  const phases = [
    { num: 1, title: 'Phase 1: The Core Rescue', icon: <Target size={20} /> },
    { num: 2, title: 'Phase 2: Mid-Focus', icon: <Calendar size={20} /> },
    { num: 3, title: 'Phase 3: The Clean Finish', icon: <Award size={20} /> }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 md:p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Comeback Meter: {completedStudyDays} / {totalStudyDays} Days
          </span>
          <span className="text-sm font-bold text-green-700 dark:text-green-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <ProgressBar value={progressPercent} />
      </div>

      <table className="w-full table-auto">
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {phases.map(phase => (
            <React.Fragment key={phase.num}>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <td colSpan="3" className="px-4 py-3 md:px-6">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-300">{phase.icon}</span>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{phase.title}</h3>
                  </div>
                </td>
              </tr>
              {data.filter(item => item.Phase === phase.num).map((item) => (
                <tr 
                  key={item.rowIndex} 
                  className={item['Module(s) Focus'].startsWith('Morning:') ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
                >
                  <td className="px-4 py-4 md:px-6 w-16 md:w-20">
                    <CustomCheckbox 
                      checked={item.Done} 
                      onChange={() => onToggle(item.rowIndex, !item.Done)}
                      disabled={isUpdating === item.rowIndex}
                    />
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    <div className={`font-bold ${item.Done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.Subject}
                    </div>
                    <div className={`text-sm ${item.Done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.Date}
                    </div>
                  </td>
                  <td className="px-4 py-4 md:px-6 hidden lg:table-cell">
                    <div className={`text-sm ${item.Done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item['Module(s) Focus']}
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Renders the detailed Subject Topic view
 */
const SubjectTrackerView = ({ sheetName, data, onToggle, isUpdating, onAddTopic, isAddingTopic }) => {
  const modules = [...new Set(data.map(item => item.Module))]; // Get unique modules
  
  const completed = data.filter(item => item.Done).length;
  const total = data.length;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 md:p-6 border-b dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Subject Progress: {completed} / {total} Topics
          </span>
          <span className="text-sm font-bold text-green-700 dark:text-green-400">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <ProgressBar value={progressPercent} />
      </div>

      <table className="w-full table-auto">
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {modules.map(moduleNum => (
            <React.Fragment key={moduleNum}>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <td colSpan="2" className="px-4 py-3 md:px-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Module {moduleNum}</h3>
                </td>
              </tr>
              
              {/* --- TOPIC LIST --- */}
              {data.filter(item => item.Module === moduleNum).map((item) => (
                <tr key={item.rowIndex} className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-4 md:px-6 w-16 md:w-20">
                    <CustomCheckbox 
                      checked={item.Done} 
                      onChange={() => onToggle(item.rowIndex, !item.Done)}
                      disabled={isUpdating === item.rowIndex}
                    />
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    <div className={`text-sm ${item.Done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.Topic}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* --- ADD TOPIC FORM --- */}
              <tr className="bg-white dark:bg-gray-800">
                <td className="px-4 py-3 md:px-6 w-16 md:w-20">
                  <div className="flex items-center justify-center w-6 h-6">
                    <Plus size={16} className="text-gray-400" />
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6">
                  <AddTopicForm
                    moduleNum={moduleNum}
                    sheetName={sheetName}
                    onAddTopic={onAddTopic}
                    isAddingTopic={isAddingTopic}
                  />
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [allData, setAllData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 'Daily_Plan' or 'Maths_Tracker', etc.
  const [currentView, setCurrentView] = useState('Daily_Plan');
  
  // Track which specific row is currently being updated
  const [isUpdating, setIsUpdating] = useState(null); // stores the rowIndex
  const [isAddingTopic, setIsAddingTopic] = useState(false); // NEW: Track add topic state

  // --- Data Fetching ---
  const fetchData = async () => {
    if (APPS_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE')) {
      setStatus('error');
      setErrorMessage('Please paste your Apps Script Web App URL into the `APPS_SCRIPT_URL` constant.');
      return;
    }
    
    setStatus('loading');
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Parse all sheets
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

  // --- Actions ---
  
  /**
   * Universal toggle handler.
   * Sends the update to Google Sheets via POST request.
   */
  const handleToggle = async (sheetName, rowIndex, newValue) => {
    // Prevent double-clicks
    if (isUpdating !== null) return; 
    
    setIsUpdating(rowIndex);

    // 1. Optimistic UI Update (update local state immediately)
    setAllData(prevData => {
      const newData = [...prevData[sheetName]];
      const itemIndex = newData.findIndex(item => item.rowIndex === rowIndex);
      if (itemIndex > -1) {
        newData[itemIndex] = { ...newData[itemIndex], Done: newValue };
      }
      return { ...prevData, [sheetName]: newData };
    });

    // 2. Send update to Google Sheet API
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // mode: 'no-cors', // REMOVED: This was the source of the problem.
        
        // --- FIX ---
        // Change content type to 'text/plain'. This makes it a "simple request"
        // and avoids the CORS pre-flight (OPTIONS) request that is failing.
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'toggleCheckbox', // Specify the action
          sheetName: sheetName,
          rowIndex: rowIndex, // Send the 0-based data row index
          value: newValue,
        }),
      });

      // NEW: Check the response from the API
      const result = await response.json();
      if (result.status !== 'success') {
        // If the API reports an error, throw one to trigger the 'catch' block
        throw new Error(result.message || 'API returned an error');
      }
      
    } catch (err) {
      // 3. Rollback UI on error
      console.error("Failed to update sheet:", err);
      setAllData(prevData => {
        const newData = [...prevData[sheetName]];
        const itemIndex = newData.findIndex(item => item.rowIndex === rowIndex);
        if (itemIndex > -1) {
          // Revert to the old value
          newData[itemIndex] = { ...newData[itemIndex], Done: !newValue }; 
        }
        return { ...prevData, [sheetName]: newData };
      });
      // You could show an error toast here
    } finally {
      setIsUpdating(null); // Re-enable checkboxes
    }
  };

  // --- NEW ACTION ---
  /**
   * Handles adding a new topic.
   * Sends the update to Google Sheets and then re-fetches all data.
   */
  const handleAddTopic = async (sheetName, moduleNum, topicName) => {
    if (isAddingTopic) return;
    setIsAddingTopic(true);

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // mode: 'no-cors', // REMOVED: This was the source of the problem.
        
        // --- FIX ---
        // Change content type to 'text/plain'. This makes it a "simple request"
        // and avoids the CORS pre-flight (OPTIONS) request that is failing.
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'addTopic', // Specify the new action
          sheetName: sheetName,
          moduleNum: moduleNum,
          topicName: topicName,
        }),
      });
      
      // NEW: Check the response from the API
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'API returned an error');
      }

      // After successfully adding, we must re-fetch all data
      // to get the new row (and its correct rowIndex) from the Sheet.
      fetchData();

    } catch (err) {
      console.error("Failed to add topic:", err);
      // You could show an error toast here
    } finally {
      setIsAddingTopic(false);
    }
  };


  // --- Effects ---

  // Load data on initial render
  useEffect(() => {
    fetchData();
  }, []);

  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Render ---

  const subjectSheets = allData ? Object.keys(allData).filter(name => name.endsWith('_Tracker')) : [];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                S3 Comeback Tracker
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Cloud-Synced with Google Sheets
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(prev => !prev)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RotateCcw size={14} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <main>
          {status === 'loading' && <LoadingSpinner />}
          
          {status === 'error' && <ErrorDisplay message={errorMessage} />}
          
          {status === 'loaded' && allData && (
            <>
              {/* --- Navigation Tabs --- */}
              <nav className="mb-4 overflow-x-auto">
                <div className="flex flex-nowrap space-x-2 pb-2">
                  <button
                    onClick={() => setCurrentView('Daily_Plan')}
                    className={`px-4 py-2 font-semibold rounded-lg transition-colors text-sm flex-shrink-0 ${
                      currentView === 'Daily_Plan' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    Daily Plan
                  </button>
                  {subjectSheets.map(sheetName => (
                    <button
                      key={sheetName}
                      onClick={() => setCurrentView(sheetName)}
                      className={`px-4 py-2 font-semibold rounded-lg transition-colors text-sm flex-shrink-0 ${
                        currentView === sheetName 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {sheetName.replace('_Tracker', '')}
                    </button>
                  ))}
                </div>
              </nav>

              {/* --- Dynamic View --- */}
              {currentView === 'Daily_Plan' && (
                <DailyPlanView 
                  data={allData.Daily_Plan} 
                  onToggle={(rowIndex, newValue) => handleToggle('Daily_Plan', rowIndex, newValue)}
                  isUpdating={isUpdating}
                />
              )}
              
              {subjectSheets.includes(currentView) && (
                <SubjectTrackerView 
                  sheetName={currentView}
                  data={allData[currentView]} 
                  onToggle={(rowIndex, newValue) => handleToggle(currentView, rowIndex, newValue)}
                  isUpdating={isUpdating}
                  onAddTopic={handleAddTopic}
                  isAddingTopic={isAddingTopic}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}