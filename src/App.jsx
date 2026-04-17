import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { useAppData } from './hooks/useData';
import { useAppStore } from './store/useAppStore';

import AuthView from './components/views/AuthView';
import OnboardingView from './components/views/OnboardingView';
import DailyPlanView from './components/views/DailyPlanView';
import SyllabusView from './components/views/SyllabusView';
import SubjectDetailView from './components/views/SubjectDetailView';
import AnalyticsView from './components/views/AnalyticsView';
import ProfileView from './components/views/ProfileView';

import { CalendarDays, BookOpen, BarChart2, User } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } }
});

// ─── Inner app (has access to query context) ──────────────────────────────────
function AppInner() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const currentView = useAppStore(state => state.currentView);
  const setCurrentView = useAppStore(state => state.setCurrentView);
  const setActivePlanId = useAppStore(state => state.setActivePlanId);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data, isLoading } = useAppData(session?.user?.id);

  // Sync active plan from profile into Zustand when data loads
  useEffect(() => {
    if (data?.activePlan?.id) {
      setActivePlanId(data.activePlan.id);
    }
  }, [data?.activePlan?.id, setActivePlanId]);

  // Route to Today after onboarding completes
  const handleOnboardingComplete = () => {
    setCurrentView('Today');
  };

  // ── Loading ──
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#bfd8bd] border-t-[#77bfa3] rounded-full animate-spin" />
          <p className="text-[#627833] font-semibold text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Not signed in ──
  if (!session) return <AuthView />;

  // ── Signed in but data loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#bfd8bd] border-t-[#77bfa3] rounded-full animate-spin" />
          <p className="text-[#627833] font-semibold text-sm">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  // ── Onboarding ──
  if (data && !data.profile?.is_onboarded) {
    return <OnboardingView session={session} onComplete={handleOnboardingComplete} />;
  }

  // ── Navigation config ──
  const NAV = [
    { id: 'Today',   label: 'Today',    Icon: CalendarDays },
    { id: 'Syllabus', label: 'Subjects', Icon: BookOpen },
    { id: 'Stats',   label: 'Stats',    Icon: BarChart2 },
    { id: 'Profile', label: 'Profile',  Icon: User },
  ];

  // Tabs that hide the bottom nav (drill-down views)
  const isFullscreen = currentView === 'SubjectDetail';

  // ── Render active view ──
  const renderView = () => {
    switch (currentView) {
      case 'Today':         return <DailyPlanView data={data} />;
      case 'Syllabus':      return <SyllabusView data={data} />;
      case 'SubjectDetail': return <SubjectDetailView data={data} />;
      case 'Stats':         return <AnalyticsView data={data} />;
      case 'Profile':       return <ProfileView data={data} session={session} />;
      default:              return <DailyPlanView data={data} />;
    }
  };

  // Get active nav tab (SubjectDetail maps to Syllabus)
  const activeNavTab = currentView === 'SubjectDetail' ? 'Syllabus' : currentView;

  return (
    <div className="min-h-screen bg-[#fdfdf9] selection:bg-[#bfd8bd]/50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#fdfdf9]/90 backdrop-blur-sm border-b border-[#edeec9]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#77bfa3] flex items-center justify-center">
              <BookOpen size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-bold text-[#313c1a] text-sm tracking-tight">S4 Planner</span>
              {data?.activePlan && (
                <span className="ml-2 text-[10px] font-bold text-[#98c9a3] uppercase tracking-widest hidden sm:inline">
                  {data.activePlan.title}
                </span>
              )}
            </div>
          </div>
          {data?.dashboard?.streak > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#3c7f65] bg-[#bfd8bd]/20 px-3 py-1.5 rounded-full border border-[#dde7c7]">
              🔥 {data.dashboard.streak} day streak
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      {!isFullscreen && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#edeec9] safe-area-inset-bottom">
          <div className="max-w-3xl mx-auto px-2 flex items-stretch">
            {NAV.map(({ id, label, Icon }) => {
              const isActive = activeNavTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 ${
                    isActive ? 'text-[#3c7f65]' : 'text-[#98c9a3] hover:text-[#627833]'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#bfd8bd]/30' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#3c7f65]' : 'text-[#b8cd8a]'}`}>
                    {label}
                  </span>
                  {isActive && <div className="w-4 h-0.5 bg-[#77bfa3] rounded-full mt-0.5" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// ─── Root with QueryClient provider ──────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
