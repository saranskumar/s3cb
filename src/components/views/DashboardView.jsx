import React from 'react';
import { Target, AlertTriangle, BookOpen, Clock, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function DashboardView({ data }) {
  const { dashboard, subjects } = data || {};
  const setView = useAppStore((state) => state.setCurrentView);
  const setSelectedSubjectId = useAppStore((state) => state.setSelectedSubjectId);

  if (!dashboard) return <div className="p-4 text-slate-400">No dashboard data.</div>;

  const {
    today, nextExam, examCountdowns, todaysTasks, overallReadiness,
    dailyStudyProgress, dangerSubject, hoursStudiedToday, hoursStudiedWeek
  } = dashboard;

  const handleSubjectClick = (id) => setSelectedSubjectId(id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target size={14}/> Readiness</div>
          <div className="text-3xl font-bold text-white">{overallReadiness}%</div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock size={14}/> Today</div>
           <div className="text-3xl font-bold text-white">{hoursStudiedToday} <span className="text-sm">hrs</span></div>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between md:col-span-2">
           <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CheckCircle size={14}/> Daily Progress</span>
              <span className="text-cyan-400">{dailyStudyProgress?.percentage || 0}%</span>
           </div>
           <div className="mt-2 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-500 transition-all duration-500" style={{width: `${dailyStudyProgress?.percentage || 0}%`}}></div>
           </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="grid md:grid-cols-2 gap-4">
        {nextExam && (
          <div className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer" onClick={() => handleSubjectClick(nextExam.id)}>
             <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Next Exam</div>
             <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-bold text-white">{nextExam.name}</h3>
                  <p className="text-sm text-slate-400">{nextExam.examDate}</p>
               </div>
               <div className="text-right">
                 <div className="text-3xl font-bold text-cyan-400">{nextExam.daysToExam}</div>
                 <div className="text-xs text-slate-500">Days</div>
               </div>
             </div>
          </div>
        )}

        {dangerSubject && (
           <div className="glass-panel p-5 rounded-xl border border-red-900/50 bg-red-950/10 hover:border-red-500/50 transition-colors cursor-pointer" onClick={() => handleSubjectClick(dangerSubject.id)}>
             <div className="text-red-400/80 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
               <AlertTriangle size={14} /> Danger Subject
             </div>
             <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-xl font-bold text-red-200">{dangerSubject.name}</h3>
                  <p className="text-xs text-red-400/70 mt-1">Readiness: {dangerSubject.readiness}%</p>
               </div>
               <div className="text-xs text-right text-red-300 max-w-[120px]">
                 Exam close & target far
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Target Array Snapshot */}
      <div className="glass-panel p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Target size={18} className="text-cyan-400" /> Target Blueprint
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Internal</th>
                <th className="pb-2 font-medium">Req. External</th>
                <th className="pb-2 font-medium">Safe Target</th>
                <th className="pb-2 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {subjects?.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => handleSubjectClick(sub.id)}>
                  <td className="py-3 font-semibold text-slate-200">{sub.name}</td>
                  <td className="py-3">
                    <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono">{sub.internalScored}/{sub.internalTotal}</span>
                  </td>
                  <td className="py-3 text-slate-300 font-mono">
                    {sub.requiredExternal} <span className="text-slate-600">/ {sub.externalTotal}</span>
                  </td>
                  <td className="py-3 text-cyan-400 font-bold">{sub.safeExternalRangeLabel}</td>
                  <td className="py-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded
                      ${sub.priority === 'make_or_break' || sub.priority === 'CRITICAL' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 
                        sub.priority === 'free_marks' || sub.priority === 'Advantage' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                        sub.priority === 'score_booster' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' :
                        'bg-slate-800 text-slate-400'
                      }
                    `}>
                      {sub.priority.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <CalendarIcon size={18} className="text-cyan-400" /> Today's Focus ({todaysTasks?.length || 0})
          </h3>
          <button onClick={() => setView('Daily_Plan')} className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">View full plan →</button>
        </div>
        <div className="space-y-2">
           {todaysTasks?.length ? todaysTasks.map(task => (
             <div key={task.id} className={`flex items-start gap-3 p-4 rounded-xl border ${task.isOutputBlock ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                {task.isOutputBlock && <BookOpen size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />}
                {!task.isOutputBlock && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0"></div>}
                <div>
                   <div className="flex items-center gap-2">
                     <span className={`font-semibold text-sm ${task.isOutputBlock ? 'text-indigo-300' : 'text-slate-200'}`}>{task.title}</span>
                     {task.timeSlot === 'night' && <span className="bg-purple-950 border border-purple-800 text-purple-300 text-[10px] px-1.5 rounded-sm uppercase tracking-wider">Night</span>}
                   </div>
                   <div className="text-xs text-slate-500 mt-1">{task.subjectName} • {task.plannedMinutes} mins</div>
                </div>
             </div>
           )) : (
             <div className="text-slate-500 text-sm p-4 text-center border border-dashed border-slate-800 rounded-xl">No specific tasks scheduled today. Take a mock or review weak areas.</div>
           )}
        </div>
      </div>

    </div>
  );
}
