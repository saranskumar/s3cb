import React from 'react';
import { Calendar, ChevronRight, BookOpen, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function SyllabusView({ data }) {
  const { subjects, topics, activePlan } = data || {};
  const setSelectedSubjectId = useAppStore(state => state.setSelectedSubjectId);
  const setView = useAppStore(state => state.setCurrentView);

  const handleSubjectClick = (id) => {
    setSelectedSubjectId(id);
    setView('SubjectDetail');
  };

  const getDaysLeft = (examDate) => {
    if (!examDate) return null;
    const diff = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyStyle = (daysLeft) => {
    if (daysLeft === null) return '';
    if (daysLeft <= 3) return 'text-red-500 bg-red-50 border-red-200';
    if (daysLeft <= 7) return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-[#50a987] bg-[#bfd8bd]/20 border-[#dde7c7]';
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#313c1a] tracking-tight">Subjects</h2>
          <p className="text-[#627833] text-sm font-medium mt-1">
            {activePlan?.title || 'Your Study Plan'} · {subjects?.length || 0} subjects
          </p>
        </div>
      </div>

      {/* Subject Cards */}
      {!subjects || subjects.length === 0 ? (
        <div className="clay-card p-12 text-center border-2 border-dashed border-[#dde7c7] bg-[#f8faf4]/50">
          <BookOpen size={40} className="mx-auto text-[#bfd8bd] mb-3" />
          <p className="font-semibold text-[#627833]">No subjects yet.</p>
          <p className="text-sm text-[#98c9a3] mt-1">Import the S4 plan to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(sub => {
            const subTopics = topics?.filter(t => t.subject_id === sub.id) || [];
            const completedTopics = subTopics.filter(t => t.status === 'done' || t.status === 'mastered' || t.status === 'revise_1' || t.status === 'revise_2').length;
            const pct = subTopics.length > 0 ? Math.round((completedTopics / subTopics.length) * 100) : 0;
            const daysLeft = getDaysLeft(sub.exam_date);

            return (
              <button
                key={sub.id}
                onClick={() => handleSubjectClick(sub.id)}
                className="clay-card text-left p-6 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 w-full"
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[#313c1a] group-hover:text-[#3c7f65] transition-colors">{sub.name}</h3>
                  <div className="flex items-center gap-2">
                    {daysLeft !== null && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getUrgencyStyle(daysLeft)}`}>
                        {daysLeft <= 0 ? 'Today!' : `${daysLeft}d left`}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-[#bfd8bd] group-hover:text-[#77bfa3] transition-colors" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="text-center border-r border-[#edeec9] pr-4">
                    <div className="font-bold text-[#313c1a] text-lg">{subTopics.length}</div>
                    <div className="text-[#627833] text-[11px] font-semibold uppercase tracking-wide">Topics</div>
                  </div>
                  <div className="text-center border-r border-[#edeec9] pr-4">
                    <div className="font-bold text-[#3c7f65] text-lg">{completedTopics}</div>
                    <div className="text-[#627833] text-[11px] font-semibold uppercase tracking-wide">Done</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-[#313c1a] text-lg">{pct}%</div>
                    <div className="text-[#627833] text-[11px] font-semibold uppercase tracking-wide">Complete</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-[#edeec9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#77bfa3] to-[#50a987] rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Exam date */}
                {sub.exam_date && (
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#98c9a3]">
                    <Calendar size={12} />
                    Exam: {new Date(sub.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
