import React from 'react';
import { Target, BookOpen, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function SubjectDetailView({ data }) {
  const selectedSubjectId = useAppStore(state => state.selectedSubjectId);
  const subject = data?.subjects?.find(s => s.id === selectedSubjectId);
  const topics = data?.topics?.filter(t => t.subjectId === selectedSubjectId) || [];

  if (!subject) return <div className="p-4 text-slate-400">Subject not found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
        {subject.priority === 'CRITICAL' && <div className="absolute top-0 right-0 left-0 h-1 bg-red-500"></div>}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white">{subject.name}</h2>
            <div className="text-slate-400 text-sm mt-1">{subject.code} • Exam: {subject.examDate}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-cyan-400">{subject.readiness}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Readiness</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
           <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 font-bold mb-1">INTERNAL</div>
              <div className="text-xl text-white font-mono">{subject.internalScored} <span className="text-sm text-slate-500">/ {subject.internalTotal}</span></div>
           </div>
           <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-500 font-bold mb-1">REQ EXTERNAL</div>
              <div className="text-xl text-white font-mono">{subject.requiredExternal} <span className="text-sm text-slate-500">/ {subject.externalTotal}</span></div>
           </div>
           <div className="bg-slate-900/50 p-4 rounded-lg border border-cyan-900/30">
              <div className="text-xs text-cyan-500 font-bold mb-1">SAFE TARGET</div>
              <div className="text-xl text-cyan-400 font-mono">{subject.safeExternalRangeLabel}</div>
           </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl">
        <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2"><BookOpen size={18} className="text-cyan-400"/> Topic Modules</h3>
        <div className="space-y-2">
           {topics.map(t => (
             <div key={t.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-start gap-3">
               <div className={`mt-1 w-2 h-2 rounded-full ${t.status === 'mastered' ? 'bg-emerald-500' : t.status === 'done' ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
               <div>
                  <div className={`text-sm ${t.status === 'mastered' || t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{t.title}</div>
                  {t.isWeak && <span className="text-[10px] text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900">WEAK</span>}
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
