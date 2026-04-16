import React, { useMemo } from 'react';
import { Target, CalendarIcon, CheckCircle, Clock } from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';

export default function DailyPlanView({ data }) {
  const { tasks } = data || {};
  const mutation = useDataMutation();
  const selectedDate = useAppStore(state => state.selectedDate);

  const handleToggle = (taskId, status) => {
    mutation.mutate({ action: 'updateTask', taskId, patch: { status } });
  };

  const visibleTasks = useMemo(() => {
    if (!tasks) return [];
    if (selectedDate) return tasks.filter(t => t.date === selectedDate);
    return tasks;
  }, [tasks, selectedDate]);

  const phases = [...new Set(visibleTasks.map(t => t.phase))].sort((a,b) => a-b).filter(Boolean);

  return (
    <div className="space-y-8 pb-20 fade-in animate-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 mb-8 sticky top-4 z-10 shadow-xl shadow-slate-950/50">
        <h3 className="font-bold text-slate-300 text-sm mb-2">S4 Execution Rules</h3>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
           <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-cyan-500" /> Solve {'>'} Read</span>
           <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-500" /> Write 2 answers daily</span>
           <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-amber-500" /> PYQs = Priority</span>
        </div>
      </div>

      {phases.map(phaseNum => {
         const phaseTasks = visibleTasks.filter(t => t.phase === phaseNum).sort((a,b) => (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0));
         if (!phaseTasks.length) return null;

         const isComplete = phaseTasks.every(t => t.status === 'completed');

         return (
           <div key={phaseNum} className={`transition-all duration-500 ${isComplete ? 'opacity-50 grayscale order-last' : ''}`}>
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-200">
               <span className="p-2 bg-slate-900 rounded-lg text-cyan-400"><Target size={18} /></span> 
               Phase {phaseNum}
             </h3>
             <div className="space-y-3">
               {phaseTasks.map(task => (
                 <div key={task.id} className={`flex gap-3 p-4 rounded-xl border transition-all ${
                    task.status === 'completed' ? 'bg-slate-900/30 border-transparent' :
                    task.isOutputBlock ? 'bg-indigo-950/30 border-indigo-500/40 relative overflow-hidden' :
                    task.isRepeat ? 'bg-amber-950/20 border-amber-900/40' :
                    'bg-slate-900 border-slate-800'
                 }`}>
                   {task.isOutputBlock && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                   <div className="mt-0.5">
                     <button
                        onClick={() => handleToggle(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-all 
                          ${task.status === 'completed' ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-500/50 scale-110' : 'bg-slate-950 border-slate-700 hover:border-cyan-500'}
                        `}
                     >
                       {task.status === 'completed' && <CheckCircle size={12} strokeWidth={3} />}
                     </button>
                   </div>
                   <div className="flex-grow">
                     <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold text-sm flex items-center gap-2 ${task.status === 'completed' ? 'line-through text-slate-600' : task.isOutputBlock ? 'text-indigo-300' : 'text-slate-200'}`}>
                          {task.title}
                          {task.timeSlot === 'night' && <span className="bg-purple-900/50 border border-purple-700 text-purple-300 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Night Only</span>}
                          {task.isRepeat && <span className="bg-amber-900/50 border border-amber-700 text-amber-300 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Repeat Cycle</span>}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <CalendarIcon size={12} className="text-cyan-500/50" />
                          {task.date}
                        </div>
                     </div>
                     <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded">{task.subjectName}</span>
                        <span className="flex items-center gap-1 text-slate-500"><Clock size={12}/> {task.plannedMinutes}m</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         );
      })}
    </div>
  );
}
