import React, { useState } from 'react';
import {
  CheckCircle, Clock, FastForward, Calendar, XCircle,
  AlertCircle, ChevronRight, Check, Plus, X, Loader2, BookOpen, LayoutGrid, Flame, Shield, Zap
} from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';
import { getSuperheroAvatar } from '../../lib/avatars';

const STATUS_COLORS = {
  completed: 'text-[#3c7f65] bg-[#bfd8bd]/20 border-[#98c9a3]/40',
  pending: 'border-l-[#77bfa3]',
  overdue: 'border-l-red-400 bg-red-50/30',
};

function EmptyStateToday({ subjects, activePlan }) {
  const setView = useAppStore(state => state.setCurrentView);
  const hasSubjects = subjects && subjects.length > 0;
  return (
    <div className="space-y-3 py-2">

      {!hasSubjects && (
        <button
          onClick={() => setView('Syllabus')}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-[#dde7c7] hover:border-[#98c9a3] hover:bg-[#f8faf4] transition-all text-left group"
        >
          <div className="w-11 h-11 rounded-xl bg-[#edeec9] flex items-center justify-center flex-shrink-0 group-hover:bg-[#bfd8bd]/50 transition-colors">
            <BookOpen size={20} className="text-[#3c7f65]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#313c1a] text-sm">Add subjects to your plan</p>
            <p className="text-xs text-[#627833] font-medium mt-0.5">Pick from the S4 library or create your own</p>
          </div>
          <ChevronRight size={16} className="text-[#bfd8bd] group-hover:text-[#77bfa3] transition-colors" />
        </button>
      )}

      {hasSubjects && (
        <button
          onClick={() => setView('Syllabus')}
          className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#edeec9] hover:border-[#98c9a3] hover:bg-[#f8faf4] transition-all text-left group shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-[#bfd8bd]/20 flex items-center justify-center flex-shrink-0">
            <BookOpen size={20} className="text-[#3c7f65]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#313c1a] text-sm">Assign topics to study dates</p>
            <p className="text-xs text-[#627833] font-medium mt-0.5">Open a subject → hover a topic → tap + Today</p>
          </div>
          <ChevronRight size={16} className="text-[#bfd8bd] group-hover:text-[#77bfa3] transition-colors" />
        </button>
      )}

      <button
        onClick={() => setView('Plans')}
        className="w-full flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#edeec9] hover:border-[#98c9a3] hover:bg-[#f8faf4] transition-all text-left group shadow-sm"
      >
        <div className="w-11 h-11 rounded-xl bg-[#bfd8bd]/20 flex items-center justify-center flex-shrink-0">
          <LayoutGrid size={20} className="text-[#3c7f65]" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-[#313c1a] text-sm">View your plans</p>
          <p className="text-xs text-[#627833] font-medium mt-0.5">Review and manage your S4 study plan</p>
        </div>
        <ChevronRight size={16} className="text-[#bfd8bd] group-hover:text-[#77bfa3] transition-colors" />
      </button>
    </div>
  );
}



export default function DailyPlanView({ data, session }) {
  const { dashboard, subjects, activePlan, profile } = data || {};
  const { todaysTasks = [], overdueTasks = [], upcomingTasks = [] } = dashboard || {};

  const completedToday = todaysTasks.filter(t => t.status === 'completed').length;
  const totalToday = todaysTasks.length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const userName = profile?.display_name || profile?.full_name || session?.user?.email?.split('@')[0] || 'Student';
  const avatarUrl = profile?.avatar_url || getSuperheroAvatar(session?.user?.email || userName);

  const TaskCard = ({ task, isOverdue = false }) => {
    const subject = subjects?.find(s => s.id === task.subject_id);
    const isDone = task.status === 'completed';
    const isSkipped = task.status === 'skipped';

    return (
      <div className={`bg-white rounded-2xl p-5 mb-3 border-l-4 shadow-sm transition-all duration-200 ${
        isDone ? 'opacity-60 border-l-[#bfd8bd] bg-[#f8faf4]' :
        isSkipped ? 'opacity-40 border-l-[#dde7c7]' :
        isOverdue ? 'border-l-red-400' :
        'border-l-[#77bfa3] hover:shadow-md'
      } border border-[#edeec9]`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {subject && (
                <span className={`text-xs font-bold uppercase tracking-wider ${isOverdue && !isDone ? 'text-red-500' : 'text-[#50a987]'}`}>
                  {subject.name}
                </span>
              )}
              {isOverdue && !isDone && (
                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">OVERDUE</span>
              )}
            </div>
            <h4 className={`font-semibold text-base leading-snug ${isDone || isSkipped ? 'line-through text-[#98c9a3]' : 'text-[#313c1a]'}`}>
              {task.title}
            </h4>
            {!isDone && !isSkipped && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[#627833]">
                <Clock size={11} /> {task.planned_minutes}m
              </div>
            )}
          </div>

          {!isDone && !isSkipped ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(task.id, 'complete')}
                className="h-9 px-4 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(119,191,163,0.3)]"
              >
                <Check size={15} /> Done
              </button>
              <button onClick={() => handleAction(task.id, 'move-tomorrow')} title="Push to Tomorrow"
                className="w-9 h-9 bg-[#f8faf4] hover:bg-[#edeec9] text-[#627833] border border-[#dde7c7] rounded-xl flex items-center justify-center transition-all">
                <FastForward size={14} />
              </button>
              <button onClick={() => handleAction(task.id, 'skip')} title="Skip"
                className="w-9 h-9 bg-white hover:bg-red-50 text-[#627833] hover:text-red-500 border border-[#dde7c7] rounded-xl flex items-center justify-center transition-all">
                <XCircle size={14} />
              </button>
            </div>
          ) : isSkipped ? (
            <div className="flex items-center gap-2">
              <span className="text-[#aebf8a] font-bold text-xs uppercase tracking-widest px-2 py-1">Skipped</span>
              <button onClick={() => handleAction(task.id, 'unskip')} title="Undo Skip"
                className="px-3 h-8 text-xs font-bold bg-white hover:bg-[#f8faf4] text-[#627833] hover:text-[#3c7f65] border border-[#dde7c7] hover:border-[#77bfa3] rounded-lg transition-all">
                Undo
              </button>
            </div>
          ) : isDone ? (
            <div className="text-[#3c7f65] font-bold text-sm flex items-center gap-1.5 px-3 py-1.5 bg-[#bfd8bd]/20 rounded-lg border border-[#dde7c7]">
              <Check size={15} /> Done
            </div>
          ) : null}

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-28 animate-in fade-in duration-300">

      {/* Header Card */}
      <div className="clay-card bg-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#bfd8bd]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f8faf4] to-[#edeec9] border-2 border-white shadow-md flex-shrink-0 overflow-hidden">
               <img src={avatarUrl} alt="Hero" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[#98c9a3] font-bold text-[10px] uppercase tracking-[0.2em] mb-0.5">{greeting}</p>
              <h2 className="text-2xl md:text-3xl font-black text-[#313c1a] tracking-tight leading-none">
                {userName}
              </h2>
              {dashboard?.nextExam && (
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 ${dashboard.nextExam.daysLeft === 0 ? 'text-[#fb923c]' : 'text-[#627833] opacity-60'}`}>
                  {dashboard.nextExam.daysLeft === 0 ? (
                    <span className="flex items-center gap-1"><Zap size={10} className="fill-current" /> Exam Today: {dashboard.nextExam.name}</span>
                  ) : (
                    <span className="flex items-center gap-1">{dashboard.nextExam.name} · {dashboard.nextExam.daysLeft} days left</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#3c7f65]">{completedToday}
                <span className="text-[#bfd8bd] text-xl font-semibold">/{totalToday}</span>
              </div>
              <div className="text-[10px] font-bold text-[#627833] uppercase tracking-widest mt-1">Tasks</div>
            </div>
            {/* Progress Ring */}
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#dde7c7" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="#77bfa3" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progressPct / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#3c7f65]">{progressPct}%</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalToday > 0 && (
          <div className="mt-6 relative z-10">
            <div className="h-1.5 bg-[#edeec9] rounded-full overflow-hidden">
              <div className="h-full bg-[#77bfa3] rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Exam Day Motivational Banner */}
      {subjects.some(s => s.exam_date === new Date().toISOString().split('T')[0]) && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group animate-in zoom-in duration-500">
           <div className="absolute top-0 right-0 p-2 opacity-10 transform scale-150 translate-x-12 -translate-y-12">
              <Shield size={160} />
           </div>
           <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                    <Zap size={32} className="fill-white" />
                 </div>
                 <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none mb-1">Big Day! Best of Luck! 🚀</h3>
                    <p className="text-sm font-bold opacity-80">
                      You've prepared well. Stay calm, focused, and crush your {subjects.find(s => s.exam_date === new Date().toISOString().split('T')[0]).name} exam!
                    </p>
                 </div>
              </div>
              <div className="flex items-center justify-center bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/30 font-black uppercase text-sm tracking-widest">
                 GO GET &apos;EM!
              </div>
           </div>
        </div>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <AlertCircle size={15} className="text-red-500" />
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wide">Overdue ({overdueTasks.length})</h3>
          </div>
          {overdueTasks.map(task => <TaskCard key={task.id} task={task} isOverdue />)}
        </section>
      )}

      {/* Today */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-[#50a987]" />
            <h3 className="text-sm font-bold text-[#50a987] uppercase tracking-wide">Today ({totalToday})</h3>
          </div>
        </div>
        {totalToday === 0 ? (
          <EmptyStateToday subjects={subjects} activePlan={activePlan} />
        ) : (
          [...todaysTasks].sort((a, b) => {
            const getRank = status => status === 'pending' ? 0 : status === 'skipped' ? 1 : 2;
            return getRank(a.status) - getRank(b.status);
          }).map(task => <TaskCard key={task.id} task={task} />)
        )}
      </section>

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <ChevronRight size={15} className="text-[#627833]" />
            <h3 className="text-sm font-bold text-[#627833] uppercase tracking-wide">Upcoming ({upcomingTasks.length})</h3>
          </div>
          <div className="space-y-2">
            {upcomingTasks.slice(0, 5).map(task => {
              const subject = subjects?.find(s => s.id === task.subject_id);
              return (
                <div key={task.id} className="bg-white rounded-xl p-4 flex justify-between items-center border border-[#edeec9] shadow-sm">
                  <div>
                    {subject && <div className="text-[10px] font-bold text-[#98c9a3] uppercase tracking-wider mb-0.5">{subject.name}</div>}
                    <span className="font-semibold text-[#313c1a] text-sm">{task.title}</span>
                  </div>
                  <span className="text-xs font-bold text-[#77bfa3] bg-[#bfd8bd]/20 px-2 py-1 rounded-lg border border-[#dde7c7]">{task.date}</span>
                </div>
              );
            })}
            {upcomingTasks.length > 5 && (
              <p className="text-center text-xs font-semibold text-[#627833]">+{upcomingTasks.length - 5} more planned</p>
            )}
          </div>
        </section>
      )}


    </div>
  );
}
