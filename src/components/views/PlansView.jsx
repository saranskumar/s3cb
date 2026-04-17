import React, { useState } from 'react';
import { Target, Plus, Book, ArrowRight, Loader2 } from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';

export default function PlansView({ data }) {
  const { raw, templates } = data || {};
  const { allPlans = [] } = raw || {};
  
  const mutation = useDataMutation();
  const setCurrentView = useAppStore(state => state.setCurrentView);
  
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      if (selectedTemplate === 'custom') {
        const tempId = crypto.randomUUID();
        await mutation.mutateAsync({
          action: 'createPlan',
          plan: { id: tempId, title, description: desc }
        });
        await mutation.mutateAsync({ action: 'setActivePlan', planId: tempId });
      } else {
        await mutation.mutateAsync({
          action: 'importTemplatePlan',
          templateId: selectedTemplate,
          title: title
        });
        // We'll trust the onSuccess refetch to update the list, but we don't have the exact ID here immediately if from rpc.
        // The user can click it from the list after it appears.
      }
      setIsCreating(false);
      setTitle('');
      setDesc('');
    } catch(err) {
       alert("Error creating plan: " + err.message);
       setIsCreating(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    await mutation.mutateAsync({ action: 'setActivePlan', planId });
    setCurrentView('Daily_Plan'); // Switch to main planner view
  };

  return (
    <div className="space-y-8 fade-in animate-in pb-24">
      
      <div className="flex justify-between items-end mb-8">
         <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#313c1a]">Your Study Plans</h2>
            <p className="text-[#627833] font-medium tracking-wide mt-1">Select a workspace or build a new one.</p>
         </div>
      </div>

      {allPlans.length > 0 && (
         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPlans.map(plan => (
               <div key={plan.id} onClick={() => handleSelectPlan(plan.id)} className="clay-card p-6 cursor-pointer group hover:border-[#98c9a3]/50">
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-xl bg-[#bfd8bd]/20 flex items-center justify-center text-[#3c7f65]">
                        <Book size={20} />
                     </div>
                     {data?.activePlan?.id === plan.id && <span className="badge-surface px-3 py-1 rounded-full text-xs font-semibold">Active</span>}
                  </div>
                  <h3 className="text-xl font-semibold text-[#313c1a] mb-1">{plan.title}</h3>
                  <p className="text-[#627833] text-sm mb-6">{plan.description || 'No description provided.'}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#50a987] group-hover:text-[#3c7f65] transition-colors">
                     Open Workspace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* CREATE NEW PLAN CARD */}
      <div className="clay-card p-8 mt-12 bg-white/50 border-dashed border-2">
         <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-[#313c1a]"><Plus size={20} /> Create New Plan</h3>
         <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-[#627833] mb-2">Plan Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-4 input-surface" placeholder="e.g. End Semester Exams" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-[#627833] mb-2">Description (optional)</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 input-surface h-24" placeholder="Brief outline..."></textarea>
               </div>
            </div>
            <div className="space-y-4">
               <label className="block text-sm font-semibold text-[#627833] mb-2">Start From Library (Templates)</label>
               <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  <div 
                     onClick={() => setSelectedTemplate('custom')}
                     className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTemplate === 'custom' ? 'bg-[#bfd8bd]/20 border-[#98c9a3]' : 'bg-transparent border-[var(--border)] hover:bg-black/5'}`}
                  >
                     <p className="font-semibold text-sm">Empty Workspace</p>
                  </div>
                  {templates?.plans?.map(tp => (
                     <div 
                        key={tp.id} 
                        onClick={() => setSelectedTemplate(tp.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTemplate === tp.id ? 'bg-[#bfd8bd]/20 border-[#98c9a3]' : 'bg-transparent border-[var(--border)] hover:bg-black/5'}`}
                     >
                        <p className="font-semibold text-sm">{tp.title}</p>
                        <p className="text-xs text-[#627833] mt-1">{tp.description}</p>
                     </div>
                  ))}
               </div>
               
               <button 
                 onClick={handleCreate} 
                 disabled={isCreating || !title.trim()} 
                 className="w-full p-4 mt-4 bg-[#77bfa3] hover:bg-[#50a987] text-white rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50 transition-all shadow-[0_4px_14px_rgba(119,191,163,0.3)]">
                 {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Initialize Plan'}
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}
