import React from 'react';
import { User, LogOut, BookOpen, Bell, BellOff, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';

export default function ProfileView({ data, session }) {
  const { profile, activePlan } = data || {};
  const hourlyReminders = useAppStore(state => state.hourlyReminders);
  const setHourlyReminders = useAppStore(state => state.setHourlyReminders);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const userName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student';
  const userEmail = session?.user?.email || '';

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300 max-w-lg mx-auto">

      {/* User card */}
      <div className="clay-card p-7 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#bfd8bd]/30 border border-[#dde7c7] flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <User size={28} className="text-[#3c7f65]" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#313c1a] truncate">{userName}</h2>
          <p className="text-sm text-[#627833] font-medium truncate">{userEmail}</p>
          {activePlan && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-[#50a987]">
              <BookOpen size={12} /> {activePlan.title}
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="clay-card divide-y divide-[#edeec9] overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hourlyReminders ? (
              <Bell size={18} className="text-[#3c7f65]" />
            ) : (
              <BellOff size={18} className="text-[#98c9a3]" />
            )}
            <div>
              <div className="font-semibold text-[#313c1a] text-sm">Hourly Reminders</div>
              <div className="text-xs text-[#627833]">Browser study reminder alerts</div>
            </div>
          </div>
          <button
            onClick={() => setHourlyReminders(!hourlyReminders)}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${hourlyReminders ? 'bg-[#77bfa3]' : 'bg-[#dde7c7]'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${hourlyReminders ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="p-5 flex items-center gap-3">
          <Info size={18} className="text-[#98c9a3]" />
          <div>
            <div className="font-semibold text-[#313c1a] text-sm">S4 Study Planner</div>
            <div className="text-xs text-[#627833]">Version 2.0 · Built for S4 exam prep</div>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full p-4 flex items-center justify-center gap-2.5 text-red-500 font-bold rounded-2xl border-2 border-red-100 bg-red-50/50 hover:bg-red-50 transition-all"
      >
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
