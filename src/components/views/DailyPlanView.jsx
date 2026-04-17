import React, { useState } from 'react';
import {
  CheckCircle, Clock, FastForward, Calendar, XCircle,
  AlertCircle, ChevronRight, Check, Plus, X, Loader2, BookOpen, LayoutGrid, Flame
} from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';

const STATUS_COLORS = {
  completed: 'text-[#3c7f65] bg-[#bfd8bd]/20 border-[#98c9a3]/40',
  pending: 'border-l-[#77bfa3]',
  overdue: 'border-l-red-400 bg-red-50/30',
};

function EmptyStateToday({ subjects, activePlan }) {
  const setView = useAppStore(state => state.setCurrentView);
  const hasSubjects = subjects && subjects.length > 0;
  const isMaster = activePlan?.has_master_schedule;

  return (
    <div className="space-y-3 py-2">
      {isMaster && (
        <div className="p-5 bg-[#77bfa3]/5 border border-[#77bfa3]/30 rounded-2xl mb-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#77bfa3] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Flame size={20} className="text-white" />
            </div>
            <div>
            <p className="font-bold text-[#313c1a] text-sm">SR AI Master Schedule Active</p>
            <p className="text-xs text-[#627833] font-medium mt-1 leading-relaxed">
              Your intensive SR AI roadmap is ready. If you don't see tasks for today, you can manually add a task or check the upcoming schedule.
            </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setView('Plans')}
                  className="text-[10px] font-bold text-white bg-[#77bfa3] px-3 py-1.5 rounded-lg hover:bg-[#50a987] transition-all"
                >
                  View Dates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {hasSubjects && !isMaster && (
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



export default function DailyPlanView({ data }) {
  const { dashboard, subjects, activePlan } = data || {};
  const { todaysTasks = [], overdueTasks = [], upcomingTasks = [] } = dashboard || {};

  const mutation = useDataMutation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ subjectId: '', title: '', plannedMinutes: 60 });
  const [isAdding, setIsAdding] = useState(false);


  const handleAction = (taskId, actionType) => {
    if (actionType === 'complete') {
      mutation.mutate({ action: 'updateTask', taskId, patch: { status: 'completed' } });
    } else if (actionType === 'skip') {
      mutation.mutate({ action: 'updateTask', taskId, patch: { status: 'skipped' } });
    } else if (actionType === 'unskip') {
      mutation.mutate({ action: 'updateTask', taskId, patch: { status: 'pending' } });
    } else if (actionType === 'move-tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      mutation.mutate({ action: 'rescheduleTask', taskId, date: d.toISOString().split('T')[0] });
    }
  };

  const handleAddTask = async () => {
    if (!addForm.title.trim()) return;
    setIsAdding(true);
    try {
      await mutation.mutateAsync({
        action: 'addTask',
        task: {
          id: crypto.randomUUID(),
          title: addForm.title,
          subject_id: addForm.subjectId || null,
          date: new Date().toISOString().split('T')[0],
          planned_minutes: parseInt(addForm.plannedMinutes) || 60,
          status: 'pending',
        }
      });
      setShowAddModal(false);
      setAddForm({ subjectId: '', title: '', plannedMinutes: 60 });
    } catch (e) {
      alert(e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const completedToday = todaysTasks.filter(t => t.status === 'completed').length;
  const totalToday = todaysTasks.length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
          <div>
            <p className="text-[#98c9a3] font-bold text-xs uppercase tracking-widest mb-1">{todayStr}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#313c1a] tracking-tight">
              {activePlan ? activePlan.title : "Today's Study"}
            </h2>
            {dashboard?.nextExam && (
              <p className="text-[#627833] text-sm font-medium mt-1">
                Next: <span className="text-[#3c7f65] font-bold">{dashboard.nextExam.name}</span> in {Math.max(0, dashboard.nextExam.daysLeft)} days
              </p>
            )}
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
          <button
            onClick={() => {
              setAddForm(f => ({ ...f, subjectId: dashboard?.nextExam?.id || '' }));
              setShowAddModal(true);
            }}
            className="h-8 px-3 text-xs font-bold text-[#3c7f65] bg-[#bfd8bd]/20 hover:bg-[#bfd8bd]/40 border border-[#dde7c7] rounded-lg flex items-center gap-1 transition-all"
          >
            <Plus size={13} /> Add Task
          </button>
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

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#dde7c7] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#313c1a] text-lg">Add Task for Today</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#627833] hover:text-[#313c1a]"><X size={22} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#627833] mb-1.5">Subject (optional)</label>
                <select value={addForm.subjectId} onChange={e => setAddForm(f => ({ ...f, subjectId: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]">
                  <option value="">No Subject</option>
                  {subjects?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#627833] mb-1.5">Task Title</label>
                <input type="text" value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Revise Module 2 topics"
                  className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#627833] mb-1.5">Planned Minutes</label>
                <input type="number" value={addForm.plannedMinutes} onChange={e => setAddForm(f => ({ ...f, plannedMinutes: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  min="5" max="480"
                />
              </div>
              <button onClick={handleAddTask} disabled={isAdding || !addForm.title.trim()}
                className="w-full py-3.5 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
