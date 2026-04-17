import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, LogOut, BookOpen, Bell, BellOff, Info, 
  Trophy, Save, Loader2, Sparkles, RefreshCw, 
  Settings, LayoutGrid, Check, ShieldCheck, Mail, MapPin,
  ChevronDown, Plus, Trash2, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../hooks/useNotifications';
import { useDataMutation } from '../../hooks/useData';
import { generateRandomName, generateNameOptions } from '../../lib/names';
import PlansView from './PlansView';
import LeaderboardView from './LeaderboardView';

export default function ProfileView({ data, session }) {
  const { profile, activePlan, userPreferences } = data || {};
  const notificationState = useNotifications(session);
  const mutation = useDataMutation();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'plans', 'ranks'
  const [expandedSection, setExpandedSection] = useState('identity'); // 'identity', 'alerts', 'special'
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(!!profile?.show_on_leaderboard);
  
  // Multi-reminder state
  const [reminderTimes, setReminderTimes] = useState(userPreferences?.reminder_times || ['09:00']);
  const [nudge8pmEnabled, setNudge8pmEnabled] = useState(userPreferences?.nudge_8pm_enabled !== false);
  
  const [nameSuggestions, setNameSuggestions] = useState([]);

  useEffect(() => {
    if (userPreferences?.reminder_times) setReminderTimes(userPreferences.reminder_times);
    if (userPreferences?.nudge_8pm_enabled !== undefined) setNudge8pmEnabled(userPreferences.nudge_8pm_enabled);
  }, [userPreferences]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handlePushToggle = async () => {
    if (notificationState.isSubscribed) {
      const success = await notificationState.unsubscribeFromPush();
      if (success) {
        mutation.mutate({
          action: 'updateNotificationPreferences',
          patch: { enabled: false }
        });
      }
    } else {
      const success = await notificationState.subscribeToPush();
      if (success) {
        mutation.mutate({
          action: 'updateNotificationPreferences',
          patch: { 
            enabled: true,
            active_plan_id: activePlan?.id || null,
            tz_offset: new Date().getTimezoneOffset()
          }
        });
      }
    }
  };

  // ─── Auto-Save Helpers ───
  
  const saveProfileChange = useCallback((patch) => {
    mutation.mutate({
      action: 'updateProfile',
      patch
    });
  }, [mutation]);

  const saveNotificationChange = useCallback((patch) => {
    mutation.mutate({
      action: 'updateNotificationPreferences',
      patch: {
        ...patch,
        active_plan_id: activePlan?.id || null,
        tz_offset: new Date().getTimezoneOffset()
      }
    });
  }, [mutation, activePlan]);

  // Debounced Nickname Save
  useEffect(() => {
    if (displayName === profile?.display_name) return;
    const timer = setTimeout(() => {
      saveProfileChange({ display_name: displayName });
    }, 1000);
    return () => clearTimeout(timer);
  }, [displayName, profile?.display_name, saveProfileChange]);

  const addReminderTime = () => {
    const next = [...reminderTimes, '12:00'];
    setReminderTimes(next);
    saveNotificationChange({ reminder_times: next });
  };

  const removeReminderTime = (idx) => {
    const next = reminderTimes.filter((_, i) => i !== idx);
    setReminderTimes(next);
    saveNotificationChange({ reminder_times: next });
  };

  const updateReminderTime = (idx, val) => {
    const next = [...reminderTimes];
    next[idx] = val;
    setReminderTimes(next);
    // Only save if it looks like a complete time string
    if (val.length === 5) {
      saveNotificationChange({ reminder_times: next });
    }
  };

  const toggleLeaderboard = (val) => {
    setShowOnLeaderboard(val);
    saveProfileChange({ show_on_leaderboard: val });
  };

  const toggleNudge8pm = (val) => {
    setNudge8pmEnabled(val);
    saveNotificationChange({ nudge_8pm_enabled: val });
  };

  const sendTestNotification = async () => {
    if (!notificationState.isSubscribed) {
      alert("Please enable notifications first!");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification("S4 Test Notification", {
        body: "Your study alerts are working perfectly! 🚀",
        icon: "/icon.ico",
        badge: "/icon.ico",
        vibrate: [200, 100, 200]
      });
    } catch (e) {
      alert("Test failed: " + e.message);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const userName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Student';
  const userEmail = session?.user?.email || '';

  // ─── Sub-views ───

  if (activeTab === 'plans') {
    return (
      <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-right-4 duration-300">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        <PlansView data={data} />
      </div>
    );
  }

  if (activeTab === 'ranks') {
    return (
      <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-right-4 duration-300">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        <LeaderboardView data={data} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 animate-in fade-in slide-in-from-left-4 duration-300 max-w-lg mx-auto">
      
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Hero Profile Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#77bfa3] to-indigo-400 rounded-[2rem] blur opacity-10"></div>
        <div className="clay-card p-1 relative bg-white overflow-hidden">
           <div className="p-7 flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f8faf4] to-[#edeec9] border-2 border-white shadow-inner flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User size={32} className="text-[#3c7f65]" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl shadow-md border border-[#edeec9] flex items-center justify-center text-[#77bfa3]">
                   <ShieldCheck size={16} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-[#313c1a] truncate leading-tight">{userName}</h2>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#627833] opacity-60">
                    <Mail size={12} /> {userEmail}
                  </div>
                  {activePlan && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#50a987] bg-[#f0f9f5] px-2 py-1 rounded-lg w-fit mt-1 border border-[#bfd8bd]/30">
                      <MapPin size={10} /> {activePlan.title}
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* settings Groups */}
      <div className="space-y-4">
        
        {/* Group 1: Identity & Social */}
        <div className="clay-card overflow-hidden">
           <button 
             onClick={() => toggleSection('identity')}
             className="w-full p-6 flex items-center justify-between group transition-all"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#fb923c]/10 flex items-center justify-center text-[#fb923c]">
                    <User size={20} />
                 </div>
                 <div className="text-left">
                    <h3 className="font-black text-[#313c1a] text-sm uppercase tracking-wider">Public Identity</h3>
                    <p className="text-[10px] font-bold text-[#627833] opacity-60">Nickname & Board Presence</p>
                 </div>
              </div>
              <div className={`transition-transform duration-300 ${expandedSection === 'identity' ? 'rotate-180' : ''}`}>
                 <ChevronDown size={20} className="text-[#c1c8a9]" />
              </div>
           </button>

           {expandedSection === 'identity' && (
             <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="h-px bg-[#edeec9]/50 w-full mb-5"></div>
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-[#f8faf4] rounded-2xl border border-[#edeec9]">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-[#313c1a] text-sm">Leaderboard Opt-in</div>
                      <div className="text-[10px] text-[#627833] font-medium mt-0.5 leading-relaxed">Active by default. Participate in the global rankings with your anonymous nickname.</div>
                    </div>
                    <button
                      onClick={() => toggleLeaderboard(!showOnLeaderboard)}
                      className={`relative w-12 h-7 rounded-full transition-all duration-500 focus:outline-none flex-shrink-0 shadow-inner ${showOnLeaderboard ? 'bg-[#fb923c]' : 'bg-[#dde7c7]'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-lg shadow-md transition-all duration-500 flex items-center justify-center ${showOnLeaderboard ? 'left-6' : 'left-1'}`}>
                         {showOnLeaderboard && <Check size={10} className="text-[#fb923c] animate-in zoom-in" />}
                      </div>
                    </button>
                 </div>

                 {showOnLeaderboard && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-[#627833] uppercase tracking-widest">Display Name</label>
                        <button 
                          onClick={() => setNameSuggestions(generateNameOptions(4))}
                          className="text-[10px] font-black text-[#fb923c] hover:text-[#d97706] flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Sparkles size={12} /> Suggest
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter anonymous name…"
                          className="w-full p-4 pr-12 rounded-2xl border-2 border-[#edeec9] text-[#313c1a] bg-white font-black text-sm focus:outline-none focus:border-[#fb923c] transition-all shadow-sm"
                        />
                        <button 
                          onClick={() => setDisplayName(generateRandomName())}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c1c8a9] hover:text-[#fb923c] transition-colors p-1"
                          title="Randomize"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>

                      {nameSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 animate-in zoom-in-95 duration-200">
                          {nameSuggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setDisplayName(suggestion);
                                setNameSuggestions([]);
                              }}
                              className="text-[10px] font-black px-3 py-2 bg-[#fdfdf9] border-2 border-[#edeec9] text-[#627833] rounded-xl hover:border-[#fb923c] hover:text-[#fb923c] transition-all active:scale-95 shadow-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                 )}
               </div>
             </div>
           )}
        </div>

        {/* Group 2: Notifications */}
        <div className="clay-card overflow-hidden">
           <button 
             onClick={() => toggleSection('alerts')}
             className="w-full p-6 flex items-center justify-between group transition-all"
           >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#77bfa3]/10 flex items-center justify-center text-[#77bfa3]">
                    <Bell size={20} />
                 </div>
                 <div className="text-left">
                    <h3 className="font-black text-[#313c1a] text-sm uppercase tracking-wider">Alerts & Timing</h3>
                    <p className="text-[10px] font-bold text-[#627833] opacity-60">Push Controls & Daily Timing</p>
                 </div>
              </div>
              <div className={`transition-transform duration-300 ${expandedSection === 'alerts' ? 'rotate-180' : ''}`}>
                 <ChevronDown size={20} className="text-[#c1c8a9]" />
              </div>
           </button>

           {expandedSection === 'alerts' && (
             <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="h-px bg-[#edeec9]/50 w-full mb-5"></div>
               
               <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-[#f8faf4] rounded-2xl border border-[#edeec9]">
                    <div className="flex-1 pr-4">
                      <div className="font-bold text-[#313c1a] text-sm">Push Notifications</div>
                      <div className="text-[10px] text-[#627833] font-medium mt-0.5 leading-relaxed">Receive personalized study nudges throughout the day.</div>
                    </div>
                    <button
                      onClick={handlePushToggle}
                      disabled={notificationState.isLoading}
                      className={`relative w-12 h-7 rounded-full transition-all duration-500 focus:outline-none flex-shrink-0 disabled:opacity-50 shadow-inner ${notificationState.isSubscribed ? 'bg-[#77bfa3]' : 'bg-[#dde7c7]'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-lg shadow-md transition-all duration-500 flex items-center justify-center ${notificationState.isSubscribed ? 'left-6' : 'left-1'}`}>
                         {notificationState.isSubscribed && <Check size={10} className="text-[#77bfa3] animate-in zoom-in" />}
                      </div>
                    </button>
                  </div>

                  {notificationState.isSubscribed && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      
                      {/* Multiple Reminders List */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-[#627833] uppercase tracking-widest">Custom Reminders</label>
                          <button 
                            onClick={addReminderTime}
                            className="text-[10px] font-black text-[#77bfa3] flex items-center gap-1 hover:text-[#50a987]"
                          >
                            <Plus size={12} /> Add Time
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                           {reminderTimes.map((time, idx) => (
                             <div key={idx} className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                               <input 
                                  type="time" 
                                  value={time} 
                                  onChange={(e) => updateReminderTime(idx, e.target.value)}
                                  className="flex-1 p-3 rounded-xl border-2 border-[#edeec9] text-[#313c1a] bg-white font-black text-sm focus:outline-none focus:border-[#77bfa3] transition-all shadow-sm"
                                />
                                {reminderTimes.length > 1 && (
                                  <button 
                                    onClick={() => removeReminderTime(idx)}
                                    className="p-3 bg-red-50 text-red-400 rounded-xl border-2 border-red-50 hover:border-red-100 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                             </div>
                           ))}
                        </div>
                      </div>

                      {/* 8 PM Finish Strong Nudge */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between p-4 bg-[#f0f9f5] rounded-2xl border-2 border-[#bfd8bd]/30">
                          <div className="flex-1 pr-4">
                            <div className="font-bold text-[#313c1a] text-sm flex items-center gap-1.5">
                               <Zap size={14} className="text-orange-400" /> 8 PM Finish Strong
                            </div>
                            <div className="text-[9px] text-[#627833] font-black mt-0.5 leading-relaxed uppercase tracking-widest">Smart Nudge</div>
                            <div className="text-[10px] text-[#627833] font-medium mt-1 leading-relaxed opacity-70">Send a nudge only if tasks are incomplete by 8 PM.</div>
                          </div>
                          <button
                            onClick={() => toggleNudge8pm(!nudge8pmEnabled)}
                            className={`relative w-12 h-7 rounded-full transition-all duration-500 focus:outline-none flex-shrink-0 shadow-inner ${nudge8pmEnabled ? 'bg-[#77bfa3]' : 'bg-[#dde7c7]'}`}
                          >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-lg shadow-md transition-all duration-500 flex items-center justify-center ${nudge8pmEnabled ? 'left-6' : 'left-1'}`}>
                               {nudge8pmEnabled && <Check size={10} className="text-[#77bfa3] animate-in zoom-in" />}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Test Notification Button */}
                      <button
                        onClick={sendTestNotification}
                        className="w-full py-3 bg-white border-2 border-[#77bfa3] text-[#77bfa3] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#77bfa3] hover:text-white transition-all active:scale-95"
                      >
                         Send Test Notification
                      </button>

                    </div>
                  )}

                  {notificationState.permission === 'denied' && (
                     <div className="text-[10px] text-red-500 font-black px-4 py-3 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2">
                       <BellOff size={14} /> Permission Denied - check browser settings.
                     </div>
                  )}
               </div>
             </div>
           )}
        </div>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-center gap-2 p-4 bg-[#f8faf4] rounded-2xl border border-[#edeec9] animate-in slide-in-from-bottom-2 duration-500">
           <div className={`w-2 h-2 rounded-full ${mutation.isLoading ? 'bg-[#fb923c] animate-pulse' : 'bg-[#77bfa3]'}`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-[#627833] opacity-60">
             {mutation.isLoading ? 'Syncing Changes...' : 'All Settings Saved'}
           </span>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full p-5 flex items-center justify-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] border-2 border-red-100 bg-red-50/30 hover:bg-red-50 transition-all active:scale-[0.97]"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-6 pb-2 opacity-30 group cursor-default">
          <Info size={14} className="group-hover:text-[#77bfa3] transition-colors" />
          <div className="text-[9px] font-black tracking-[0.3em] uppercase">KōA · Production v2.1</div>
      </div>
    </div>
  );
}

function TabSwitcher({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'settings', label: 'Settings', Icon: Settings },
    { id: 'plans',    label: 'Plans',    Icon: LayoutGrid },
    { id: 'ranks',    label: 'Ranks',    Icon: Trophy },
  ];

  return (
    <div className="flex bg-[#f8faf4] p-1.5 rounded-[1.5rem] border-2 border-[#edeec9] shadow-inner mb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all duration-300 ${
            activeTab === tab.id 
              ? 'bg-white text-[#313c1a] shadow-md border border-[#edeec9] scale-105' 
              : 'text-[#aebf8a] hover:text-[#627833] hover:bg-white/40'
          }`}
        >
          <tab.Icon size={16} className={activeTab === tab.id ? 'text-[#77bfa3]' : 'text-current'} /> 
          {tab.label}
        </button>
      ))}
    </div>
  );
}
