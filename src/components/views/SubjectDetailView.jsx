import React, { useState } from 'react';
import {
  ArrowLeft, Calendar, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, Plus, Loader2, X, Check
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDataMutation } from '../../hooks/useData';
import { generateId } from '../../lib/utils';

export default function SubjectDetailView({ data }) {
  const selectedSubjectId = useAppStore(state => state.selectedSubjectId);
  const setView = useAppStore(state => state.setCurrentView);
  const mutation = useDataMutation();

  const { subjects, modules, topics } = data || {};
  const subject = subjects?.find(s => s.id === selectedSubjectId);
  const subjectModules = modules?.filter(m => m.subject_id === selectedSubjectId)
    .sort((a, b) => (a.module_no || 0) - (b.module_no || 0)) || [];
  const subjectTopics = topics?.filter(t => t.subject_id === selectedSubjectId) || [];

  const [expandedModules, setExpandedModules] = useState(new Set(subjectModules.map(m => m.id)));
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicModuleId, setNewTopicModuleId] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  if (!subject) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#627833] font-medium">Subject not found.</p>
        <button onClick={() => setView('Syllabus')} className="mt-3 text-sm text-[#50a987] font-bold hover:underline">← Back to Subjects</button>
      </div>
    );
  }

  const allDone = subjectTopics.filter(t => t.status === 'done' || t.status === 'mastered' || t.status === 'revise_1' || t.status === 'revise_2').length;
  const pct = subjectTopics.length > 0 ? Math.round((allDone / subjectTopics.length) * 100) : 0;
  const daysLeft = subject.exam_date
    ? Math.ceil((new Date(subject.exam_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const toggleModule = (id) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleToggleDone = (topic) => {
    const newStatus = (topic.status === 'done' || topic.status === 'mastered') ? 'todo' : 'done';
    mutation.mutate({ action: 'updateTopicStatus', topicId: topic.id, status: newStatus });
  };

  const handlePlanToday = (topic) => {
    const today = new Date().toISOString().split('T')[0];
    mutation.mutate({
      action: 'addTask',
      task: {
        id: generateId(),
        title: topic.title || topic.name,
        subject_id: subject.id,
        module_id: topic.module_id,
        topic_id: topic.id,
        date: today,
        planned_minutes: 60,
        status: 'pending',
      }
    });
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim() || !newTopicModuleId) return;
    setIsAddingTopic(true);
    try {
      await mutation.mutateAsync({
        action: 'addTopic',
        topic: {
          id: generateId(),
          name: newTopicName,
          title: newTopicName,
          subject_id: selectedSubjectId,
          module_id: newTopicModuleId,
          status: 'todo',
          sort_order: 999,
        }
      });
      setNewTopicName('');
      setNewTopicModuleId('');
      setShowAddTopicModal(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsAddingTopic(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">

      {/* Back + Header */}
      <div>
        <button
          onClick={() => setView('Syllabus')}
          className="flex items-center gap-1.5 text-[#627833] hover:text-[#313c1a] font-bold text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> All Subjects
        </button>

        <div className="clay-card p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#bfd8bd]/15 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#313c1a] tracking-tight">{subject.name}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {subject.exam_date && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#50a987] bg-[#bfd8bd]/20 px-3 py-1 rounded-full border border-[#dde7c7]">
                    <Calendar size={12} />
                    {new Date(subject.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {daysLeft !== null && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    daysLeft <= 3 ? 'text-red-500 bg-red-50 border-red-200' :
                    daysLeft <= 7 ? 'text-orange-500 bg-orange-50 border-orange-200' :
                    'text-[#3c7f65] bg-[#bfd8bd]/20 border-[#dde7c7]'
                  }`}>
                    {daysLeft <= 0 ? 'Exam day!' : `${daysLeft} days left`}
                  </span>
                )}
              </div>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="text-center bg-[#f8faf4] border border-[#dde7c7] rounded-xl px-5 py-3">
                <div className="text-2xl font-bold text-[#3c7f65]">{pct}%</div>
                <div className="text-[10px] font-bold text-[#627833] uppercase tracking-widest mt-0.5">Complete</div>
              </div>
              <div className="text-center bg-[#f8faf4] border border-[#dde7c7] rounded-xl px-5 py-3">
                <div className="text-2xl font-bold text-[#313c1a]">{allDone}<span className="text-[#bfd8bd] font-semibold">/{subjectTopics.length}</span></div>
                <div className="text-[10px] font-bold text-[#627833] uppercase tracking-widest mt-0.5">Topics</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-5 h-1.5 bg-[#edeec9] rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-gradient-to-r from-[#77bfa3] to-[#50a987] rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Module-wise Topic List */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-[#313c1a] text-lg">Syllabus Outline</h3>
        <button
          onClick={() => setShowAddTopicModal(true)}
          className="h-9 px-3 text-xs font-bold text-[#3c7f65] bg-[#bfd8bd]/20 hover:bg-[#bfd8bd]/40 border border-[#dde7c7] rounded-xl flex items-center gap-1.5 transition-all"
        >
          <Plus size={13} /> Add Topic
        </button>
      </div>

      <div className="space-y-3">
        {subjectModules.map(mod => {
          const modTopics = subjectTopics.filter(t => t.module_id === mod.id)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          const modDone = modTopics.filter(t => t.status === 'done' || t.status === 'mastered' || t.status === 'revise_1' || t.status === 'revise_2').length;
          const isExpanded = expandedModules.has(mod.id);

          return (
            <div key={mod.id} className="clay-card overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-[#f8faf4] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                    modDone === modTopics.length && modTopics.length > 0
                      ? 'bg-[#bfd8bd] text-[#182e1d]'
                      : 'bg-[#edeec9] text-[#627833]'
                  }`}>
                    {mod.module_no || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-[#313c1a] group-hover:text-[#3c7f65] transition-colors">{mod.title}</div>
                    <div className="text-xs text-[#627833] font-medium">
                      {modDone}/{modTopics.length} topics done
                      {modTopics.length > 0 && (
                        <span className="ml-2 text-[#98c9a3]">({Math.round((modDone / modTopics.length) * 100)}%)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini progress */}
                  <div className="hidden md:block w-20 h-1.5 bg-[#edeec9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#77bfa3] rounded-full transition-all duration-500"
                      style={{ width: modTopics.length > 0 ? `${Math.round((modDone / modTopics.length) * 100)}%` : '0%' }} />
                  </div>
                  {isExpanded ? <ChevronDown size={18} className="text-[#98c9a3]" /> : <ChevronRight size={18} className="text-[#98c9a3]" />}
                </div>
              </button>

              {/* Topics */}
              {isExpanded && (
                <div className="border-t border-[#edeec9] divide-y divide-[#f0f4ea]">
                  {modTopics.length === 0 ? (
                    <p className="text-sm text-[#98c9a3] p-4 text-center font-medium">No topics in this module.</p>
                  ) : modTopics.map(topic => {
                    const isDone = topic.status === 'done' || topic.status === 'mastered' || topic.status === 'revise_1' || topic.status === 'revise_2';
                    return (
                      <div key={topic.id} className="flex items-center justify-between px-5 py-3.5 group hover:bg-[#f8faf4] transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleDone(topic)}
                            className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-[#77bfa3] border-[#77bfa3] text-white'
                                : 'border-[#dde7c7] hover:border-[#77bfa3] bg-white'
                            }`}
                          >
                            {isDone && <Check size={14} strokeWidth={3} />}
                          </button>
                          <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-[#bfd8bd]' : 'text-[#313c1a]'}`}>
                            {topic.title || topic.name}
                          </span>
                        </div>
                        {!isDone && (
                          <button
                            onClick={() => handlePlanToday(topic)}
                            title="Add to Today's tasks"
                            className="flex-shrink-0 ml-3 h-7 px-3 text-[11px] font-bold text-[#3c7f65] bg-[#bfd8bd]/20 hover:bg-[#bfd8bd]/40 border border-[#dde7c7] rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            + Today
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#dde7c7] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#313c1a] text-lg">Add Topic</h3>
              <button onClick={() => setShowAddTopicModal(false)} className="text-[#627833] hover:text-[#313c1a]"><X size={22} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#627833] mb-1.5">Module</label>
                <select value={newTopicModuleId} onChange={e => setNewTopicModuleId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]">
                  <option value="">Select module...</option>
                  {subjectModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#627833] mb-1.5">Topic Name</label>
                <input type="text" value={newTopicName} onChange={e => setNewTopicName(e.target.value)}
                  placeholder="e.g. Dijkstra's Algorithm"
                  className="w-full p-3 rounded-xl border border-[#dde7c7] text-[#313c1a] bg-[#f8faf4] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                />
              </div>
              <button onClick={handleAddTopic} disabled={isAddingTopic || !newTopicName.trim() || !newTopicModuleId}
                className="w-full py-3.5 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                {isAddingTopic ? <Loader2 size={18} className="animate-spin" /> : 'Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
