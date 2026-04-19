import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Trophy, Flame, CheckCircle2, User, Loader2, 
  Award, Zap, Crown, Shield, Target, ChevronRight
} from 'lucide-react';
import { getSuperheroAvatar } from '../../lib/avatars';

export default function LeaderboardView({ data }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = data || {};

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: records, error } = await supabase
        .from('public_leaderboard')
        .select('*')
        .order('rank_score', { ascending: false })
        .order('current_streak', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setLeaderboard(records || []);
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setLoading(false);
    }
  };

  const getLeague = (streak) => {
    if (streak >= 30) return { name: 'Diamond', color: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50', icon: Crown, next: null };
    if (streak >= 14) return { name: 'Gold', color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', bg: 'bg-yellow-50', icon: Award, next: 30 };
    if (streak >= 7) return { name: 'Silver', color: 'bg-slate-400', text: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50', icon: Shield, next: 14 };
    if (streak >= 3) return { name: 'Bronze', color: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50', icon: Shield, next: 7 };
    return { name: 'Iron', color: 'bg-stone-400', text: 'text-stone-500', border: 'border-stone-200', bg: 'bg-stone-50', icon: Target, next: 3 };
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#77bfa3]" />
        <p className="text-sm font-bold text-[#627833] uppercase tracking-widest">Calculating Ranks...</p>
      </div>
    );
  }

  const isOptedIn = profile?.show_on_leaderboard && (profile?.public_name || profile?.display_name);
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Find user's position
  const userRankIdx = leaderboard.findIndex(u => u.user_id === profile?.id);
  const userRank = userRankIdx !== -1 ? userRankIdx + 1 : 'Unranked';
  const myLeague = getLeague(profile?.current_streak || 0);

  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto">
      
      <div className="space-y-8 pb-32 px-1">
        
        {/* Dynamic Header */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#fb923c] to-[#77bfa3] rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
          <div className="clay-card p-6 relative bg-white flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-[#fdfdf9] rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-[#edeec9]">
              <Trophy className="text-[#fb923c]" size={24} />
            </div>
            <h2 className="text-2xl font-black text-[#313c1a] tracking-tight">Hall of Focus</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-black text-[#627833] uppercase tracking-wider opacity-70">Season 1</span>
               <div className="w-1 h-1 rounded-full bg-[#627833]/20"></div>
               <span className="text-[10px] font-black text-[#50a987] uppercase tracking-wider">Public League</span>
            </div>
          </div>
        </div>

        {/* User Opt-In Alert */}
        {!isOptedIn && (
          <div className="bg-[#fb923c]/5 border border-[#fb923c]/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#fb923c]/10 flex items-center justify-center text-[#fb923c]">
                <User size={16} />
              </div>
              <p className="text-[10px] font-bold text-[#b45309]">Join the rankings to compete globally.</p>
            </div>
            <button className="text-[9px] font-black uppercase text-[#b45309] bg-white px-3 py-1.5 rounded-lg border border-[#fb923c]/20 shadow-sm active:scale-95">
              Opt In
            </button>
          </div>
        )}

        {/* Podium */}
        {topThree.length > 0 && (
          <div className="flex items-end justify-center gap-2 md:gap-4 px-2 pt-8 pb-4">
            {/* Rank 2 */}
            {topThree[1] && (
               <PodiumSpot 
                 user={topThree[1]} 
                 rank={2} 
                 height="h-28" 
                 bgColor="from-[#f8fafc] to-[#f1f5f9]" 
                 borderColor="border-slate-200" 
                 textColor="text-slate-700"
                 league={getLeague(topThree[1].current_streak)}
               />
            )}

            {/* Rank 1 */}
            {topThree[0] && (
               <PodiumSpot 
                 user={topThree[0]} 
                 rank={1} 
                 height="h-36" 
                 bgColor="from-yellow-50 to-yellow-100/30" 
                 borderColor="border-yellow-200" 
                 textColor="text-[#313c1a]"
                 isKing
                 league={getLeague(topThree[0].current_streak)}
               />
            )}

            {/* Rank 3 */}
            {topThree[2] && (
               <PodiumSpot 
                 user={topThree[2]} 
                 rank={3} 
                 height="h-24" 
                 bgColor="from-orange-50 to-orange-100/20" 
                 borderColor="border-orange-100" 
                 textColor="text-orange-700"
                 league={getLeague(topThree[2].current_streak)}
               />
            )}
          </div>
        )}

        {/* User List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
             <span className="text-[10px] font-black uppercase text-[#627833] tracking-[0.2em]">Competitors ({leaderboard.length})</span>
             <Target size={14} className="text-[#aebf8a]" />
          </div>
          
          {rest.map((user, idx) => {
            const rank = idx + 4;
            const isCurrentUser = user.user_id === profile?.id;
            const league = getLeague(user.current_streak);
            const LeagueIcon = league.icon;

            return (
              <div 
                key={user.user_id} 
                className={`clay-card p-4 transition-all flex items-center gap-4 group hover:translate-x-1 ${
                  isCurrentUser ? 'border-[#fb923c] ring-4 ring-[#fb923c]/5' : 'hover:border-[#77bfa3]'
                }`}
              >
                <div className={`w-8 text-center font-black text-xs ${rank < 10 ? 'text-[#313c1a]/40' : 'text-slate-300'}`}>
                  {rank}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#f8faf4] border-2 border-[#edeec9] overflow-hidden flex-shrink-0 relative">
                  <img 
                    src={user.avatar_url || getSuperheroAvatar(user.public_name || "Anonymous Student")} 
                    className="w-full h-full object-cover"
                    alt={user.public_name || "Anonymous Student"} 
                  />
                  {isCurrentUser && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#fb923c] text-white rounded-lg flex items-center justify-center shadow-lg transform rotate-12">
                       <Crown size={12} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-black text-sm truncate ${isCurrentUser ? 'text-[#b45309]' : 'text-[#313c1a]'}`}>
                      {user.public_name || "Anonymous Student"}
                    </h4>
                    {isCurrentUser && (
                      <span className="text-[7px] font-black bg-[#fb923c] text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[#b45309] font-black text-xs">
                      <Flame size={12} className="fill-current" /> {user.current_streak}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
                    <span className="flex items-center gap-1 text-[#627833] font-bold text-[10px] opacity-60">
                      <CheckCircle2 size={10} /> {user.completed_tasks} Done
                    </span>
                  </div>
                </div>

                <div className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border-2 ${league.border} ${league.bg}`}>
                   <LeagueIcon size={12} className={league.text} />
                   <span className={`text-[8px] font-black uppercase tracking-tighter leading-none ${league.text}`}>{league.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Personal Rank Footer */}
      {isOptedIn && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg animate-in slide-in-from-bottom-5 duration-500 z-50">
           <div className="clay-card p-4 bg-white/95 backdrop-blur-md border-t-4 border-[#77bfa3] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#77bfa3] flex flex-col items-center justify-center text-white shadow-lg">
                 <span className="text-[8px] font-black uppercase leading-none opacity-80">Rank</span>
                 <span className="text-lg font-black leading-none">{userRank}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#313c1a] truncate">{profile?.public_name || "Anonymous Student"}</span>
                    <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${myLeague.text}`}>{myLeague.name} League</span>
                 </div>
                 
                 {/* Progress to next league */}
                 {myLeague.next && (
                    <div className="mt-2 space-y-1">
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${myLeague.color} transition-all duration-1000`} 
                            style={{ width: `${Math.min(100, ((profile?.current_streak || 0) / myLeague.next) * 100)}%` }}
                          />
                       </div>
                       <div className="flex items-center justify-between text-[8px] font-black text-[#627833] opacity-60 uppercase">
                          <span>Progress to Gold</span>
                          <span className="flex items-center">
                            {profile?.current_streak || 0}/{myLeague.next} <ChevronRight size={8} />
                          </span>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function PodiumSpot({ user, rank, height, bgColor, borderColor, textColor, isKing = false, league }) {
  const LeagueIcon = league.icon;
  
  return (
    <div className={`flex flex-col items-center ${rank === 1 ? 'w-[40%] relative -top-4' : 'w-[30%]'}`}>
      <div className={`relative ${rank === 1 ? 'mb-4' : 'mb-3'}`}>
        {isKing && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce duration-[2000ms]">👑</div>}
        <div className={`w-${rank === 1 ? '16' : '12'} h-${rank === 1 ? '16' : '12'} bg-white rounded-3xl border-${rank === 1 ? '4' : '2'} ${borderColor} overflow-hidden flex items-center justify-center shadow-md`}>
           <img 
             src={user.avatar_url || getSuperheroAvatar(user.public_name || "Anonymous Student")} 
             className="w-full h-full object-cover" 
             alt={user.public_name || "Anonymous Student"}
           />
        </div>
        <div className={`absolute -bottom-2 -right-2 w-${rank === 1 ? '8' : '6'} h-${rank === 1 ? '8' : '6'} ${isKing ? 'bg-yellow-400' : 'bg-white'} rounded-xl border-${rank === 1 ? '4' : '2'} ${isKing ? 'border-white' : borderColor} flex items-center justify-center text-${rank === 1 ? 'xs' : '[10px]'} font-black ${isKing ? 'text-white' : textColor} shadow-sm`}>
          {rank}
        </div>
      </div>
      <div className={`text-[10px] font-black text-[#313c1a] uppercase truncate w-full text-center px-1 mb-2 ${rank === 1 ? 'text-xs' : ''}`}>{user.public_name || "Anonymous Student"}</div>
      <div className={`w-full bg-gradient-to-b ${bgColor} border-t border-x ${borderColor} rounded-t-[2rem] shadow-sm flex flex-col items-center pt-4 ${height} relative overflow-hidden`}>
        <div className={`font-black ${textColor} flex items-center gap-1 ${rank === 1 ? 'text-3xl' : 'text-xl'}`}>
          <Flame size={rank === 1 ? 20 : 14} className="text-orange-500 fill-orange-500"/> {user.current_streak}
        </div>
        <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${league.bg} border ${league.border}`}>
           <LeagueIcon size={8} className={league.text} />
           <span className={`text-[7px] font-black uppercase tracking-tighter ${league.text}`}>{league.name}</span>
        </div>
        {rank === 1 && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent"></div>}
      </div>
    </div>
  );
}

