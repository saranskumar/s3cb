import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { useAppData } from './hooks/useData';
import { useAppStore } from './store/useAppStore';

import AuthView from './components/views/AuthView';
import OnboardingView from './components/views/OnboardingView';
import PlanSetupView from './components/views/PlanSetupView';
import DailyPlanView from './components/views/DailyPlanView';
import SyllabusView from './components/views/SyllabusView';
import SubjectDetailView from './components/views/SubjectDetailView';
import AnalyticsView from './components/views/AnalyticsView';
import ProfileView from './components/views/ProfileView';

import { CalendarDays, BookOpen, BarChart2, User } from 'lucide-react';


const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 2 * 60 * 1000 } }
});

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  Today:         'Today',
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

  // Sync active plan from profile into Zustand
  useEffect(() => {
    if (data?.activePlan?.id) {
      setActivePlanId(data.activePlan.id);
    }
  }, [data?.activePlan?.id, setActivePlanId]);

  // Onboarding complete callback: 'planSetup' | 'subjects' | 'today'
  const handleOnboardingComplete = (route) => {
    if (route === 'planSetup') {
      setPostOnboardingRoute('planSetup');
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

  // ── Onboarding ──
  if (data && !data.profile?.is_onboarded) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  // ── Post-onboarding plan setup flow ──
  if (postOnboardingRoute === 'planSetup') {
    return <PlanSetupView data={data} onComplete={handlePlanSetupComplete} />;
  }

  // ── Nav config ──
  const NAV = [
    { id: 'Today',       label: 'Today',       Icon: CalendarDays },
    { id: 'Syllabus',    label: 'Subjects',    Icon: BookOpen },
    { id: 'Stats',       label: 'Stats',       Icon: BarChart2 },
    { id: 'Profile',     label: 'Profile',     Icon: User },
  ];

  const isFullscreen = currentView === 'SubjectDetail';

  // Active nav tab: SubjectDetail maps to Syllabus
  const activeNavTab = currentView === 'SubjectDetail' ? 'Syllabus' : currentView;

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
                        <img src="/icon.jpg" alt="Subjects" className="w-full h-full object-cover" />
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
