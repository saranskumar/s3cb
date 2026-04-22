import React, { useState, useEffect, useCallback } from 'react';
import {
  User, LogOut, BookOpen, Bell, BellOff, Info,
  Trophy, Save, Loader2, Sparkles, RefreshCw,
  Settings, LayoutGrid, Check, ShieldCheck, Mail, MapPin,
  ChevronDown, Plus, Trash2, Zap, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNotifications } from '../../hooks/useNotifications';
import { useDataMutation } from '../../hooks/useData';
import { 
  HEROES, VIBES, BOTS, PIXELS,
  getHeroUrl, getVibeUrl, getBotUrl, getPixelUrl, getSuperheroAvatar 
} from '../../lib/avatars';
import { generateRandomName } from '../../lib/names';
import PlansView from './PlansView';
import LeaderboardView from './LeaderboardView';
import CustomClockPicker from '../ui/CustomClockPicker';

export default function ProfileView({ data, session }) {
  const { profile, activePlan, userPreferences } = data || {};
  const notificationState = useNotifications(session);
  const mutation = useDataMutation();

  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'plans', 'ranks'
  const [expandedSection, setExpandedSection] = useState(null); // 'identity', 'alerts', 'special'

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [publicName, setPublicName] = useState(profile?.public_name || '');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(!!profile?.show_on_leaderboard);

  // Multi-reminder state
  const [reminderTimes, setReminderTimes] = useState(userPreferences?.reminder_times || ['09:00']);
  const [nudge8pmEnabled, setNudge8pmEnabled] = useState(userPreferences?.nudge_8pm_enabled !== false);

  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarCategory, setAvatarCategory] = useState('Heroes');

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

  // Debounced Display Name Save
  useEffect(() => {
    if (displayName === profile?.display_name) return;
    const timer = setTimeout(() => {
      saveProfileChange({ display_name: displayName });
    }, 1000);
    return () => clearTimeout(timer);
  }, [displayName, profile?.display_name, saveProfileChange]);

  // Debounced Public Name Save
  useEffect(() => {
    if (publicName === profile?.public_name) return;
    const timer = setTimeout(() => {
      saveProfileChange({ public_name: publicName });
    }, 1000);
    return () => clearTimeout(timer);
  }, [publicName, profile?.public_name, saveProfileChange]);

  const addReminderTime = (time) => {
    if (reminderTimes.includes(time)) return; // Prevent duplicates

    const next = [...reminderTimes, time].sort();
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
    // Check if the update creates a duplicate (other than the current one being edited)
    if (next.some((t, i) => i !== idx && t === val)) return;

    next[idx] = val;
    setReminderTimes(next);
    // Only save if it looks like a complete time string
    if (val.length === 5) {
      saveNotificationChange({ reminder_times: next.sort() });
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
    const result = await notificationState.sendTestNotification();
    if (!result.success) {
      alert("Test failed: " + result.error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const userName = profile?.display_name || profile?.full_name || session?.user?.email?.split('@')[0] || 'Student';
  const userEmail = session?.user?.email || '';
  const avatarUrl = profile?.avatar_url || getSuperheroAvatar(userEmail || userName);

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
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="relative group/avatar active:scale-95 transition-transform"
              title="Change Hero"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f8faf4] to-[#edeec9] border-2 border-white shadow-inner flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                  <Plus className="text-white" size={24} />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl shadow-md border border-[#edeec9] flex items-center justify-center text-[#77bfa3]">
                <ShieldCheck size={16} />
              </div>
            </button>
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
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Public Name (Leaderboard Alias) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-[#627833] uppercase tracking-widest">Public Name</label>
                        <span className="text-[9px] font-bold text-[#aebf8a] uppercase tracking-wider">Leaderboard alias</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={publicName}
                          onChange={(e) => setPublicName(e.target.value)}
                          placeholder="FocusTiger, SilentCoder…"
                          className="w-full p-4 pr-12 rounded-2xl border-2 border-[#edeec9] text-[#313c1a] bg-white font-black text-sm focus:outline-none focus:border-[#fb923c] transition-all shadow-sm"
                        />
                        <button
                          onClick={() => setPublicName(generateRandomName())}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c1c8a9] hover:text-[#fb923c] transition-colors p-1"
                          title="Randomize"
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      <p className="text-[9px] text-[#aebf8a] font-medium px-1">This is your anonymous identity. Your real Google name stays private.</p>
                    </div>

                    {nameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 animate-in zoom-in-95 duration-200">
                        {nameSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setPublicName(suggestion);
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
                        <label className="text-[10px] font-black text-[#627833] uppercase tracking-widest">Custom Reminders ({reminderTimes.length})</label>
                        <CustomClockPicker
                          value={null}
                          onChange={(val) => {
                            if (val) addReminderTime(val);
                          }}
                          trigger={
                            <button className="text-[10px] font-black text-[#77bfa3] flex items-center gap-1 hover:text-[#50a987]">
                              <Plus size={12} /> Add Time
                            </button>
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        {reminderTimes.map((time, idx) => (
                          <div key={idx} className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                            <div className="flex-1">
                              <CustomClockPicker
                                value={time}
                                onChange={(val) => {
                                  // Ensure we save properly formatted HH:mm
                                  if (val) updateReminderTime(idx, val);
                                }}
                              />
                            </div>
                            {reminderTimes.length > 1 && (
                              <button
                                onClick={() => removeReminderTime(idx)}
                                className="h-[46px] w-[46px] flex items-center justify-center bg-red-50 text-red-400 rounded-xl border border-red-100 hover:bg-red-100 hover:text-red-500 transition-all focus:outline-none flex-shrink-0"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
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

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 px-2">
              <div>
                <h3 className="text-xl font-black text-[#313c1a]">Choose Identity</h3>
              </div>
              <button 
                onClick={() => setShowAvatarPicker(false)} 
                className="w-10 h-10 rounded-2xl bg-[#f8faf4] flex items-center justify-center text-[#627833] hover:text-[#313c1a] transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 px-2">
              {['Heroes', 'Vibes', 'Bots', 'Pixels'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setAvatarCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                    avatarCategory === cat 
                      ? 'bg-[#77bfa3] text-white shadow-md shadow-[#77bfa3]/30' 
                      : 'bg-[#f8faf4] text-[#98c9a3] hover:text-[#3c7f65] hover:bg-[#edeec9]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar">
              <div className="grid grid-cols-3 gap-4 px-2">
                {/* Default Choice in 'Heroes' tab */}
                {avatarCategory === 'Heroes' && (
                  <button
                    onClick={() => {
                      saveProfileChange({ avatar_url: null });
                      setShowAvatarPicker(false);
                    }}
                    className="group relative flex flex-col items-center gap-2 active:scale-95 transition-transform"
                  >
                    <div className={`w-full aspect-square rounded-2xl border-2 transition-all flex items-center justify-center bg-[#f8faf4] ${!profile?.avatar_url ? 'border-[#77bfa3] p-1' : 'border-[#edeec9] hover:border-[#bfd8bd]'}`}>
                      <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-white to-[#edeec9] flex items-center justify-center">
                        <img src={getSuperheroAvatar(userEmail || userName)} className="w-full h-full object-cover opacity-50" />
                        <RefreshCw className="absolute text-[#3c7f65]" size={20} />
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#627833]">Default</span>
                  </button>
                )}

                {/* Heroes Mapping */}
                {avatarCategory === 'Heroes' && HEROES.map(heroKey => {
                  const url = getHeroUrl(heroKey);
                  const isSelected = profile?.avatar_url === url;
                  const heroName = heroKey.split('-').slice(1).join(' ');

                  return (
                    <button
                      key={heroKey}
                      onClick={() => { saveProfileChange({ avatar_url: url }); setShowAvatarPicker(false); }}
                      className="group relative flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <div className={`w-full aspect-square rounded-2xl border-2 transition-all p-1 overflow-hidden ${isSelected ? 'border-[#77bfa3] scale-105 shadow-md flex-shrink-0' : 'border-[#edeec9] hover:border-[#bfd8bd] hover:scale-[1.02]'}`}>
                        <img src={url} alt={heroKey} className="w-full h-full rounded-xl object-cover" />
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-[#77bfa3] text-white rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-[#627833] text-center truncate w-full">{heroName}</span>
                    </button>
                  );
                })}

                {/* Vibes Mapping */}
                {avatarCategory === 'Vibes' && VIBES.map(seed => {
                  const url = getVibeUrl(seed);
                  const isSelected = profile?.avatar_url === url;

                  return (
                    <button
                      key={seed}
                      onClick={() => { saveProfileChange({ avatar_url: url }); setShowAvatarPicker(false); }}
                      className="group relative flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <div className={`w-full aspect-square rounded-2xl border-2 transition-all p-1 overflow-hidden bg-[#f8faf4] ${isSelected ? 'border-[#77bfa3] scale-105 shadow-md' : 'border-[#edeec9] hover:border-[#bfd8bd]'}`}>
                        <img src={url} alt={seed} className="w-full h-full rounded-xl object-cover" />
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-[#77bfa3] text-white rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-[#627833]">{seed}</span>
                    </button>
                  );
                })}

                {/* Bots Mapping */}
                {avatarCategory === 'Bots' && BOTS.map(seed => {
                  const url = getBotUrl(seed);
                  const isSelected = profile?.avatar_url === url;
                  return (
                    <button
                      key={seed}
                      onClick={() => { saveProfileChange({ avatar_url: url }); setShowAvatarPicker(false); }}
                      className="group relative flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <div className={`w-full aspect-square rounded-2xl border-2 transition-all p-1 overflow-hidden bg-[#f8faf4] ${isSelected ? 'border-[#77bfa3] scale-105 shadow-md' : 'border-[#edeec9] hover:border-[#bfd8bd]'}`}>
                        <img src={url} alt={seed} className="w-full h-full rounded-xl object-cover" />
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-[#77bfa3] text-white rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-[#627833]">{seed}</span>
                    </button>
                  );
                })}

                {/* Pixels Mapping */}
                {avatarCategory === 'Pixels' && PIXELS.map(seed => {
                  const url = getPixelUrl(seed);
                  const isSelected = profile?.avatar_url === url;
                  return (
                    <button
                      key={seed}
                      onClick={() => { saveProfileChange({ avatar_url: url }); setShowAvatarPicker(false); }}
                      className="group relative flex flex-col items-center gap-2 active:scale-95 transition-transform"
                    >
                      <div className={`w-full aspect-square rounded-2xl border-2 transition-all p-1 overflow-hidden bg-[#f8faf4] ${isSelected ? 'border-[#77bfa3] scale-105 shadow-md' : 'border-[#edeec9] hover:border-[#bfd8bd]'}`}>
                        <img src={url} alt={seed} className="w-full h-full rounded-xl object-cover" />
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-[#77bfa3] text-white rounded-lg flex items-center justify-center shadow-lg animate-in zoom-in">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tight text-[#627833]">{seed}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabSwitcher({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'settings', label: 'Settings', Icon: Settings },
    { id: 'plans', label: 'Plans', Icon: LayoutGrid },
    { id: 'ranks', label: 'Ranks', Icon: Trophy },
  ];

  return (
    <div className="flex bg-[#f8faf4] p-1.5 rounded-[1.5rem] border-2 border-[#edeec9] shadow-inner mb-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all duration-300 ${activeTab === tab.id
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
