import React, { useState, useMemo } from 'react';
import {
  Calendar, Check, Plus, X, ChevronLeft, ChevronRight,
  Clock, CheckCircle, BookOpen, Layers, AlignLeft, Shield
} from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';

export default function PlannerView({ data }) {
  const { subjects = [], modules = [], topics = [], tasks = [], activePlan } = data || {};
  const mutation = useDataMutation();

  // ── Date Management ──
  const [baseDate, setBaseDate] = useState(new Date());

  // Create an array of 7 days around the baseDate
  const dateStrip = useMemo(() => {
    const strip = [];
    const start = new Date(baseDate);
    start.setDate(start.getDate() - 2); // 2 days before
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      strip.push(d);
    }
    return strip;
  }, [baseDate]);

  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const shiftDates = (days) => {
    const next = new Date(baseDate);
    next.setDate(next.getDate() + days);
    setBaseDate(next);
  };

  const handleSelectDate = (dateObj) => {
    setSelectedDateStr(dateObj.toISOString().split('T')[0]);
  };

  // ── Data for selected date ──
  const selectedTasks = useMemo(() => {
    return tasks.filter(t => t.date === selectedDateStr && t.plan_id === activePlan?.id);
  }, [tasks, selectedDateStr, activePlan]);

  // ── Add Task Modal State ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    subjectId: '',
    moduleId: '',
    topicIds: [], // array of selected topic IDs
    plannedMinutes: 60
  });
  const [isAdding, setIsAdding] = useState(false);

  // Filter modules/topics based on selections
  const availableModules = useMemo(() => {
    return modules.filter(m => m.subject_id === form.subjectId).sort((a, b) => a.module_no - b.module_no);
  }, [modules, form.subjectId]);

  const availableTopics = useMemo(() => {
    return topics.filter(t => t.module_id === form.moduleId).sort((a, b) => a.sort_order - b.sort_order);
  }, [topics, form.moduleId]);

  const toggleTopic = (id) => {
    setForm(prev => {
      const ids = prev.topicIds.includes(id)
        ? prev.topicIds.filter(tid => tid !== id)
        : [...prev.topicIds, id];
      return { ...prev, topicIds: ids };
    });
  };

  const resetForm = () => {
    setForm({ subjectId: '', moduleId: '', topicIds: [], plannedMinutes: 60 });
  };

  const handleAddTask = async () => {
    if (!form.subjectId || !form.moduleId) return;
    setIsAdding(true);
    try {
      const subject = subjects.find(s => s.id === form.subjectId);
      const selModule = modules.find(m => m.id === form.moduleId);

      const payloadTasks = [];
      const baseTask = {
        subject_id: form.subjectId,
        module_id: form.moduleId,
        date: selectedDateStr,
        status: 'pending',
      };

      if (form.topicIds.length === 0) {
        // Module-level planning
        payloadTasks.push({
          ...baseTask,
          id: crypto.randomUUID(),
          topic_id: null,
          title: `${subject.name} - ${selModule.title} (Full)`,
          planned_minutes: parseInt(form.plannedMinutes) || 60,
        });
      } else {
        // Topic-level planning (split time evenly among selected topics)
        const minsPerTopic = Math.max(10, Math.floor(parseInt(form.plannedMinutes) / form.topicIds.length) || 60);
        form.topicIds.forEach(tid => {
          const tName = topics.find(t => t.id === tid)?.title || 'Topic';
          payloadTasks.push({
            ...baseTask,
            id: crypto.randomUUID(),
            topic_id: tid,
            title: tName,
            planned_minutes: minsPerTopic,
          });
        });
      }

      await mutation.mutateAsync({
        action: 'addTask',
        task: payloadTasks,
        planId: activePlan?.id
      });
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      alert("Failed to add task(s): " + e.message);
    } finally {
      setIsAdding(false);
    }
  };

  // ── Render Helpers ──
  const isToday = (d) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0] === todayStr;
  };

  const formatDateLabel = (d) => {
    if (isToday(d)) return 'Today';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-[#313c1a] tracking-tight">Plan Maker</h2>
          <p className="text-[#627833] text-xs font-semibold mt-0.5 uppercase tracking-wide">
            Schedule your future study
          </p>
        </div>
      </div>

      {/* Date Scroller */}
      <div className="bg-white border text-[#313c1a] border-[#edeec9] rounded-2xl shadow-sm overflow-hidden p-2 flex items-center">
        <button onClick={() => shiftDates(-7)} className="p-2 text-[#98c9a3] hover:text-[#3c7f65] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 flex justify-between gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {dateStrip.map(d => {
            const dStr = d.toISOString().split('T')[0];
            const selected = dStr === selectedDateStr;
            const today = isToday(d);
            const isExamDay = subjects.some(s => s.exam_date === dStr);

            return (
              <button
                key={dStr}
                onClick={() => handleSelectDate(d)}
                className={`flex flex-col items-center justify-center py-2 min-w-[50px] rounded-xl transition-all ${selected
                    ? 'bg-[#77bfa3] text-white shadow-md'
                    : 'text-[#627833] hover:bg-[#f8faf4] hover:text-[#3c7f65]'
                  }`}
              >
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${selected ? 'text-[#e5f5eb]' : today ? 'text-[#50a987]' : ''}`}>
                  {formatDateLabel(d)}
                </div>
                <div className={`text-xl font-bold leading-none ${selected ? 'text-white' : ''}`}>
                  {d.getDate()}
                </div>
                <div className="flex gap-1 items-center mt-1 h-1.5 transition-all">
                  {today && !selected && <div className="w-1 h-1 bg-[#50a987] rounded-full" />}
                  {isExamDay && (
                    <div className="animate-pulse">
                      <Shield size={10} className={`${selected ? 'text-white' : 'text-[#fb923c]'} fill-current`} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => shiftDates(7)} className="p-2 text-[#98c9a3] hover:text-[#3c7f65] transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Tasks for chosen date */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#50a987]" />
            <h3 className="text-sm font-bold text-[#313c1a] tracking-wide">
              {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-white bg-[#77bfa3] hover:bg-[#50a987] rounded-lg transition-all shadow-[0_2px_8px_rgba(119,191,163,0.3)]"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {/* Exam Day Banner */}
        {subjects.some(s => s.exam_date === selectedDateStr) && (
          <div className="mb-4 bg-gradient-to-r from-[#fb923c] to-amber-500 rounded-2xl p-4 text-white shadow-lg overflow-hidden relative group animate-in slide-in-from-top duration-500">
            <div className="absolute top-0 right-0 p-1 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
               <Shield size={120} />
            </div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Shield size={20} className="fill-white" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">Big Day: Exam Day!</h4>
                  <p className="text-[10px] font-bold opacity-90">
                    {subjects.filter(s => s.exam_date === selectedDateStr).map(s => s.name).join(' & ')}
                  </p>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase">Good Luck 🚀</div>
            </div>
          </div>
        )}

        {selectedTasks.length === 0 ? (
          <div className="clay-card p-12 text-center border-2 border-dashed border-[#dde7c7]">
            <BookOpen size={36} className="mx-auto text-[#bfd8bd] mb-3 opacity-60" />
            <p className="font-bold text-[#627833]">Free Day!</p>
            <p className="text-xs text-[#98c9a3] mt-1 font-medium">Nothing planned for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedTasks.map(task => {
              const subject = subjects?.find(s => s.id === task.subject_id);
              const isDone = task.status === 'completed';

              return (
                <div key={task.id} className="bg-white rounded-xl p-4 flex justify-between items-center border border-[#edeec9] shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    {subject && (
                      <div className="text-[10px] font-bold text-[#77bfa3] uppercase tracking-wider mb-0.5">
                        {subject.name}
                      </div>
                    )}
                    <h4 className={`font-semibold text-sm leading-snug truncate ${isDone ? 'line-through text-[#98c9a3]' : 'text-[#313c1a]'}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-[#627833]">
                      <Clock size={12} /> {task.planned_minutes}m
                    </div>
                  </div>
                  <div>
                    {isDone ? (
                      <CheckCircle size={20} className="text-[#bfd8bd]" />
                    ) : (
                      <button
                        onClick={() => mutation.mutate({ action: 'deleteTask', taskId: task.id })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                        title="Remove from plan"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-[#dde7c7] animate-in slide-in-from-bottom-4 duration-200">

            <div className="flex justify-between items-center mb-5 border-b border-[#edeec9] pb-4">
              <div>
                <h3 className="font-bold text-[#313c1a] text-lg">Add to Plan</h3>
                <p className="text-xs text-[#77bfa3] font-semibold mt-0.5">
                  {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-[#98c9a3] hover:text-[#313c1a] w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#f8faf4] transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar pb-2">

              {/* Step 1: Subject */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#3c7f65] uppercase tracking-wider mb-2">
                  <BookOpen size={14} /> Subject
                </label>
                <select
                  value={form.subjectId}
                  onChange={e => { setForm({ subjectId: e.target.value, moduleId: '', topicIds: [], plannedMinutes: 60 }) }}
                  className="w-full p-3.5 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Step 2: Module */}
              <div className={`transition-all duration-300 ${!form.subjectId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#3c7f65] uppercase tracking-wider mb-2">
                  <Layers size={14} /> Module
                </label>
                <select
                  value={form.moduleId}
                  onChange={e => setForm(f => ({ ...f, moduleId: e.target.value, topicIds: [] }))}
                  disabled={!form.subjectId}
                  className="w-full p-3.5 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                >
                  <option value="">Select module...</option>
                  {availableModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>

              {/* Step 3: Topics (Optional) */}
              <div className={`transition-all duration-300 ${!form.moduleId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#3c7f65] uppercase tracking-wider">
                    <AlignLeft size={14} /> Topics <span className="text-[#98c9a3] normal-case tracking-normal">(Optional)</span>
                  </label>
                </div>

                {availableTopics.length === 0 && form.moduleId ? (
                  <p className="text-xs text-[#98c9a3] bg-[#f8faf4] p-3 rounded-xl">No topics defined for this module.</p>
                ) : (
                  <div className="bg-[#f8faf4] border border-[#dde7c7] rounded-xl max-h-48 overflow-y-auto p-1 text-sm font-medium">
                    {availableTopics.map(topic => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-white rounded-lg transition-colors text-left group"
                      >
                        <span className={`flex-1 min-w-0 pr-3 truncate ${form.topicIds.includes(topic.id) ? 'text-[#313c1a]' : 'text-[#627833]'}`}>
                          {topic.title || topic.name}
                        </span>
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-all ${form.topicIds.includes(topic.id) ? 'bg-[#77bfa3] text-white' : 'border-2 border-[#dde7c7] group-hover:border-[#bfd8bd]'
                          }`}>
                          {form.topicIds.includes(topic.id) && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {form.topicIds.length === 0 && form.moduleId && (
                  <p className="text-[10px] text-[#98c9a3] mt-1.5 px-1 font-bold tracking-wide uppercase">
                    No topics selected — Scheduling full module.
                  </p>
                )}
              </div>

              {/* Step 4: Time */}
              <div className={`transition-all duration-300 ${!form.moduleId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#3c7f65] uppercase tracking-wider mb-2">
                  <Clock size={14} /> Total Duration (Mins)
                </label>
                <input
                  type="number"
                  value={form.plannedMinutes}
                  onChange={e => setForm(f => ({ ...f, plannedMinutes: e.target.value }))}
                  className="w-full p-3.5 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-bold focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  min="5" max="480"
                  step="5"
                />
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-[#edeec9]">
              <button
                onClick={handleAddTask}
                disabled={isAdding || !form.subjectId || !form.moduleId}
                className="w-full py-4 bg-[#3c7f65] hover:bg-[#2d5a4c] text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:bg-[#98c9a3] flex justify-center items-center gap-2 shadow-[0_4px_14px_rgba(60,127,101,0.4)]"
              >
                {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save to Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
