import React, { useState } from 'react';
import { Calendar, ChevronRight, BookOpen, Plus, X, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useDataMutation } from '../../hooks/useData';
import { generateId } from '../../lib/utils';
import SearchableSelect from '../ui/SearchableSelect';

export default function SyllabusView({ data }) {
  const { subjects, topics, activePlan, subjectTemplates = [] } = data || {};
  const setSelectedSubjectId = useAppStore(state => state.setSelectedSubjectId);
  const setView = useAppStore(state => state.setCurrentView);
  const mutation = useDataMutation();

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customName, setCustomName] = useState('');
  const [customExamDate, setCustomExamDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubjectClick = (id) => {
    setSelectedSubjectId(id);
    setView('SubjectDetail');
  };

  const getDaysLeft = (examDate) => {
    if (!examDate) return null;
    return Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyStyle = (daysLeft) => {
    if (daysLeft === null) return '';
    if (daysLeft <= 3) return 'text-red-500 bg-red-50 border-red-200';
    if (daysLeft <= 7) return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-[#50a987] bg-[#bfd8bd]/20 border-[#dde7c7]';
  };

  const handleAddSubject = async () => {
    setIsAdding(true);
    try {
      if (selectedTemplate) {
        await mutation.mutateAsync({
          action: 'attachSubjectToSlot',
          subjectTemplateId: selectedTemplate,
          planId: activePlan?.id,
          slotId: null,
        });
      } else if (customName.trim()) {
        await mutation.mutateAsync({
          action: 'addSubject',
          subject: {
            id: generateId(),
            name: customName.trim(),
            exam_date: customExamDate || null,
          },
          planId: activePlan?.id,
        });
      }
      setShowAddSubject(false);
      setSelectedTemplate('');
      setCustomName('');
      setCustomExamDate('');
    } catch (e) {
      alert(e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const templateOptions = subjectTemplates.map(st => ({
    value: st.id,
    label: st.name,
    sub: st.code,
  }));

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#313c1a] tracking-tight">Subjects</h2>
          <p className="text-[#627833] text-xs font-semibold mt-0.5 uppercase tracking-wide">
            {activePlan?.title || 'Your Study Plan'} · {subjects?.length || 0} subjects
          </p>
        </div>
        <button
          onClick={() => setShowAddSubject(true)}
          className="h-9 px-4 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(119,191,163,0.3)]"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {/* Subject Cards */}
      {!subjects || subjects.length === 0 ? (
        <div className="clay-card p-12 text-center border-2 border-dashed border-[#dde7c7] bg-[#f8faf4]/50">
          <BookOpen size={36} className="mx-auto text-[#bfd8bd] mb-3" />
          <p className="font-semibold text-[#627833]">No subjects yet.</p>
          <p className="text-sm text-[#98c9a3] mt-1">Use the + Add button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {subjects.map(sub => {
            const subTopics = topics?.filter(t => t.subject_id === sub.id) || [];
            const completedTopics = subTopics.filter(t => ['done', 'mastered', 'revise_1', 'revise_2'].includes(t.status)).length;
            const pct = subTopics.length > 0 ? Math.round((completedTopics / subTopics.length) * 100) : 0;
            const daysLeft = getDaysLeft(sub.exam_date);

            return (
              <button
                key={sub.id}
                onClick={() => handleSubjectClick(sub.id)}
                className="clay-card text-left p-5 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 w-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-[#313c1a] group-hover:text-[#3c7f65] transition-colors">{sub.name}</h3>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getUrgencyStyle(daysLeft)}`}>
                        {daysLeft <= 0 ? 'Today!' : `${daysLeft}d`}
                      </span>
                    )}
                    <ChevronRight size={16} className="text-[#bfd8bd] group-hover:text-[#77bfa3] transition-colors" />
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3 text-xs">
                  <div className="border-r border-[#edeec9] pr-4"><div className="font-bold text-[#313c1a]">{subTopics.length}</div><div className="text-[#627833] font-semibold uppercase tracking-wide" style={{fontSize:'9px'}}>Topics</div></div>
                  <div className="border-r border-[#edeec9] pr-4"><div className="font-bold text-[#3c7f65]">{completedTopics}</div><div className="text-[#627833] font-semibold uppercase tracking-wide" style={{fontSize:'9px'}}>Done</div></div>
                  <div><div className="font-bold text-[#313c1a]">{pct}%</div><div className="text-[#627833] font-semibold uppercase tracking-wide" style={{fontSize:'9px'}}>Complete</div></div>
                </div>

                <div className="h-1.5 bg-[#edeec9] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#77bfa3] to-[#50a987] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>

                {sub.exam_date && (
                  <div className="flex items-center gap-1 mt-2.5 text-[10px] font-semibold text-[#98c9a3]">
                    <Calendar size={10} />
                    {new Date(sub.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#dde7c7] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#313c1a] text-lg">Add Subject</h3>
              <button onClick={() => setShowAddSubject(false)} className="text-[#98c9a3] hover:text-[#313c1a]"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">From Library</label>
                <SearchableSelect
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={val => { setSelectedTemplate(val); if (val) setCustomName(''); }}
                  placeholder="Pick a subject template…"
                  searchPlaceholder="Search subjects…"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#edeec9]" />
                <span className="text-xs font-bold text-[#98c9a3] uppercase tracking-wide">or create new</span>
                <div className="flex-1 h-px bg-[#edeec9]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">Custom Subject Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => { setCustomName(e.target.value); if (e.target.value) setSelectedTemplate(''); }}
                  placeholder="e.g. Computer Networks"
                  className="w-full p-3 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                />
              </div>

              {customName && !selectedTemplate && (
                <div>
                  <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">Exam Date (optional)</label>
                  <input
                    type="date"
                    value={customExamDate}
                    onChange={e => setCustomExamDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  />
                </div>
              )}

              <button
                onClick={handleAddSubject}
                disabled={isAdding || (!selectedTemplate && !customName.trim())}
                className="w-full py-3.5 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
