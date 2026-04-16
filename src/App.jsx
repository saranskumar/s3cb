import React, { useEffect } from 'react';
import { Network, RotateCcw, BellOff, BellRing, Zap, LayoutDashboard, Calendar, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { useAppData } from './hooks/useData';
import { useAppStore } from './store/useAppStore';

import DashboardView from './components/views/DashboardView';
import DailyPlanView from './components/views/DailyPlanView';
import SubjectDetailView from './components/views/SubjectDetailView';
import AnalyticsView from './components/views/AnalyticsView';

function ErrorDisplay({ message }) {
  return (
    <div className="p-6 bg-red-900/20 text-red-300 rounded-xl text-sm border border-red-800/30 mb-6 mx-4 md:mx-6 mt-6">
      <h3 className="font-bold mb-1">Error Loading API Payload</h3>
      <p>{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );
}

export default function App() {
  const { data, isLoading, isError, error, refetch, isFetching } = useAppData();
  
  const currentView = useAppStore(state => state.currentView);
  const setCurrentView = useAppStore(state => state.setCurrentView);
  const studyMode = useAppStore(state => state.studyMode);
  const setStudyMode = useAppStore(state => state.setStudyMode);
  const hourlyReminders = useAppStore(state => state.hourlyReminders);
  const setHourlyReminders = useAppStore(state => state.setHourlyReminders);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleReminders = () => setHourlyReminders(!hourlyReminders);

  return (
    <div className="text-slate-100 min-h-screen font-sans selection:bg-cyan-500/30 pb-24 md:pb-8">
      
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 md:px-6 py-4 flex justify-between items-center">
        <div>
           <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="animated-gradient-text">S4 Comeback</span>
           </h1>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-full border border-slate-800">
           <button onClick={toggleReminders} className={`p-2 transition-colors rounded-full ${hourlyReminders ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-500 hover:text-slate-300'}`}>
             {hourlyReminders ? <BellRing size={16} /> : <BellOff size={16} />}
           </button>
           <button onClick={() => setStudyMode(!studyMode)} className={`p-2 transition-colors rounded-full ${studyMode ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-500 hover:text-slate-300'}`}>
             <Zap size={16} fill={studyMode ? "currentColor" : "none"} />
           </button>
           <button onClick={() => refetch()} className={`p-2 text-slate-500 hover:text-cyan-400 transition-colors rounded-full ${isFetching ? 'animate-spin text-cyan-500' : ''}`}>
             <RotateCcw size={16} />
           </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto p-4 md:p-6">
         {isLoading ? <LoadingSpinner /> : isError ? <ErrorDisplay message={error?.message} /> : (
           <>
             {currentView === 'Dashboard' && <DashboardView data={data} />}
             {currentView === 'Daily_Plan' && <DailyPlanView data={data} />}
             {currentView === 'SubjectDetail' && <SubjectDetailView data={data} />}
             {currentView === 'Analytics' && <AnalyticsView data={data} />}
           </>
         )}
      </main>

      {/* BOTTOM NAVIGATION (Mobile optimized) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-900 px-6 py-3 flex justify-between items-center md:hidden z-50">
         <button onClick={() => setCurrentView('Dashboard')} className={`flex flex-col items-center gap-1 ${currentView === 'Dashboard' ? 'text-cyan-400' : 'text-slate-500'}`}>
           <LayoutDashboard size={20} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Dash</span>
         </button>
         <button onClick={() => setCurrentView('Daily_Plan')} className={`flex flex-col items-center gap-1 ${currentView === 'Daily_Plan' ? 'text-cyan-400' : 'text-slate-500'}`}>
           <Calendar size={20} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
         </button>
         <button onClick={() => setCurrentView('Analytics')} className={`flex flex-col items-center gap-1 ${currentView === 'Analytics' ? 'text-cyan-400' : 'text-slate-500'}`}>
           <BarChart3 size={20} />
           <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
         </button>
      </nav>

      {/* DESKTOP SIDEBAR / TAB ALTERNATIVE (We render inline tabs for desktop instead of bottom bar) */}
      <div className="hidden md:flex justify-center mt-8">
        <div className="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-full gap-1">
           <button onClick={() => setCurrentView('Dashboard')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${currentView === 'Dashboard' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>Dashboard</button>
           <button onClick={() => setCurrentView('Daily_Plan')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${currentView === 'Daily_Plan' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>Daily Plan</button>
           <button onClick={() => setCurrentView('Analytics')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${currentView === 'Analytics' ? 'bg-cyan-950 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}>Analytics</button>
        </div>
      </div>
    </div>
  );
}
