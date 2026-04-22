import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { useAppData } from './hooks/useData';
import { useAppStore } from './store/useAppStore';

import AuthView from './components/views/AuthView';
import OnboardingView from './components/views/OnboardingView';
import PlanSetupView from './components/views/PlanSetupView';
import AIImportView from './components/views/AIImportView';
import DailyPlanView from './components/views/DailyPlanView';
import PlannerView from './components/views/PlannerView';
import SyllabusView from './components/views/SyllabusView';
import SubjectDetailView from './components/views/SubjectDetailView';
import AnalyticsView from './components/views/AnalyticsView';
import ProfileView from './components/views/ProfileView';

import { CalendarDays, BookOpen, BarChart2, User, Bell, CalendarPlus, CheckCircle2 } from 'lucide-react';


const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } }
});

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  Today:         'Today',
  Planner:       'Planner',
  Syllabus:      'Subjects',
  SubjectDetail: null,          // uses subject name in view header
  Plans:         'Plans',
  Stats:         'Progress',
  Leaderboard:   'Leaderboard',
  Profile:       'Profile',
};

// ─── Inner app ────────────────────────────────────────────────────────────────
function AppInner() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [postOnboardingRoute, setPostOnboardingRoute] = useState(null);
  const currentView = useAppStore(state => state.currentView);
  const setCurrentView = useAppStore(state => state.setCurrentView);
  const setActivePlanId = useAppStore(state => state.setActivePlanId);

  // Force App to boot into Today view
  useEffect(() => {
    setCurrentView('Today');
  }, [setCurrentView]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Double check user validity to handle deleted users with stale sessions
        supabase.auth.getUser().then(({ error }) => {
          if (error) {
            supabase.auth.signOut();
            setSession(null);
          } else {
            setSession(session);
          }
          setSessionLoading(false);
        });
      } else {
        setSession(null);
        setSessionLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         // Verify user hasn't been deleted
         supabase.auth.getUser().then(({ error }) => {
           if (error) {
             supabase.auth.signOut();
             setSession(null);
           }
         });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data, isLoading } = useAppData(session);

  // Sync active plan from profile into Zustand
  useEffect(() => {
    if (data?.activePlan?.id) {
      setActivePlanId(data.activePlan.id);
    }
  }, [data?.activePlan?.id, setActivePlanId]);

  // Onboarding complete callback: 'planSetup' | 'aiImport' | 'subjects' | 'today'
  const handleOnboardingComplete = (route) => {
    if (route === 'planSetup') {
      setPostOnboardingRoute('planSetup');
    } else if (route === 'aiImport') {
      setPostOnboardingRoute('aiImport');
    } else {
      setCurrentView(route === 'subjects' ? 'Syllabus' : 'Today');
    }
  };

  const handlePlanSetupComplete = () => {
    setPostOnboardingRoute(null);
    setCurrentView('Today');
  };

  // ── Loading states ──
  if (sessionLoading) return <Spinner text="Loading…" />;
  if (!session) return <AuthView />;
  if (isLoading) return <Spinner text="Preparing your workspace…" />;

  // ── Post-onboarding AI import (must check BEFORE is_onboarded gate) ──
  // When user picks AI import, is_onboarded is still false until seeding completes.
  if (postOnboardingRoute === 'aiImport') {
    return <AIImportView data={data} onComplete={handlePlanSetupComplete} onCancel={() => setPostOnboardingRoute(null)} />;
  }

  // ── Onboarding ──
  if (data && !data.profile?.is_onboarded) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  if (postOnboardingRoute === 'planSetup') {
    return <PlanSetupView data={data} onComplete={handlePlanSetupComplete} />;
  }

  // ── Notification Awareness ──
  const needsNotificationPermission = 
    data?.profile?.is_onboarded && 
    window.Notification && 
    Notification.permission === 'default';

  // ── Nav config ──
  const NAV = [
    { id: 'Today',       label: 'Today',       Icon: CalendarDays },
    { id: 'Planner',     label: 'Planner',     Icon: CalendarPlus },
    { id: 'Syllabus',    label: 'Subjects',    Icon: BookOpen },
    { id: 'Stats',       label: 'Stats',       Icon: BarChart2 },
    { id: 'Profile',     label: 'Profile',     Icon: User },
  ];

  const isFullscreen = currentView === 'SubjectDetail';

  // Active nav tab: SubjectDetail maps to Syllabus
  const activeNavTab = currentView === 'SubjectDetail' ? 'Syllabus' : currentView;

  const renderView = () => {
    switch (currentView) {
      case 'Today':         return <DailyPlanView data={data} session={session} />;
      case 'Planner':       return <PlannerView data={data} />;
      case 'Syllabus':      return <SyllabusView data={data} />;
      case 'SubjectDetail': return <SubjectDetailView data={data} />;
      case 'Stats':         return <AnalyticsView data={data} />;
      case 'Profile':       return <ProfileView data={data} session={session} />;
      default:              return <DailyPlanView data={data} session={session} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdf9] selection:bg-[#bfd8bd]/50">
      {/* Slim top status bar */}
      {!isFullscreen && (
        <header className="sticky top-0 z-30 bg-[#fdfdf9]/92 backdrop-blur-sm border-b border-[#edeec9]/80">
          <div className="max-w-3xl mx-auto px-4 h-11 flex items-center justify-between">
            <span className="font-bold text-[#313c1a] text-sm">
              {PAGE_TITLES[currentView] ?? ''}
            </span>
            {data?.dashboard?.streak > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-[#3c7f65] bg-[#bfd8bd]/20 px-2.5 py-1 rounded-full border border-[#dde7c7]">
                🔥 {data.dashboard.streak}d
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {renderView()}
      </main>

      {/* Notification Awareness Modal */}
      {needsNotificationPermission && <NotificationAwarenessModal />}

      {/* Bottom Navigation */}
      {!isFullscreen && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#edeec9] safe-area-inset-bottom">
          <div className="max-w-3xl mx-auto px-1 flex items-stretch">
            {/* eslint-disable-next-line no-unused-vars */}
            {NAV.map(({ id, label, Icon: IconComponent }) => {
              const isActive = activeNavTab === id;
              const isSyllabus = id === 'Syllabus';
              return (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 ${
                    isActive ? 'text-[#3c7f65]' : 'text-[#b8cd8a] hover:text-[#627833]'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#bfd8bd]/30' : ''}`}>
                    {isSyllabus ? (
                      <div className={`w-[19px] h-[19px] rounded-md overflow-hidden ${isActive ? 'ring-1 ring-[#3c7f65]' : 'opacity-70'}`}>
                        <img src="/icon-512.png" alt="Subjects" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <IconComponent size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${isActive ? 'text-[#3c7f65]' : 'text-[#b8cd8a]'}`}>
                    {label}
                  </span>
                  {isActive && <div className="w-3 h-0.5 bg-[#77bfa3] rounded-full mt-0.5" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function Spinner({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdf9]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-4 border-[#bfd8bd] border-t-[#77bfa3] rounded-full animate-spin" />
        <p className="text-[#627833] font-semibold text-sm">{text}</p>
      </div>
    </div>
  );
}

function NotificationAwarenessModal() {
  const [closed, setClosed] = useState(() => localStorage.getItem('koa_notif_seen') === 'true');

  if (closed) return null;

  const handleClose = () => {
    localStorage.setItem('koa_notif_seen', 'true');
    setClosed(true);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      // Use catch to handle mobile environments where insecure prompt fails
      Notification.requestPermission().catch(console.warn);
      handleClose();
    } else {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 border border-[#edeec9]">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#77bfa3] to-indigo-400 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        
        <div className="w-16 h-16 rounded-3xl bg-[#f0f9f5] flex items-center justify-center text-[#77bfa3] mb-6 shadow-inner mx-auto border border-[#bfd8bd]/30">
          <Bell size={28} strokeWidth={2.5} className="animate-pulse" />
        </div>

        <h3 className="text-2xl font-black text-[#313c1a] text-center mb-3">Maximize Your Focus</h3>
        <p className="text-[#627833] text-sm text-center mb-6 leading-relaxed">
          KōA relies on perfectly timed nudges to build accountability. Enable notifications to protect your study streak.
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 bg-[#f8faf4] p-3 rounded-xl border border-[#edeec9]/50">
            <CheckCircle2 size={16} className="text-[#fb923c] flex-shrink-0" />
            <span className="text-xs font-bold text-[#313c1a]">Silently clears when session starts</span>
          </div>
          <div className="flex items-center gap-3 bg-[#f8faf4] p-3 rounded-xl border border-[#edeec9]/50">
            <CheckCircle2 size={16} className="text-[#fb923c] flex-shrink-0" />
            <span className="text-xs font-bold text-[#313c1a]">Automated morning & evening nudges</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={requestPermission}
            className="w-full py-4 bg-[#313c1a] hover:bg-black text-[#edeec9] hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
          >
            Enable Notifications
          </button>
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-transparent text-[#627833] hover:text-[#313c1a] font-bold text-xs uppercase tracking-widest transition-all"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
