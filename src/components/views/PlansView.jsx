import React, { useState } from 'react';
import {
  Plus, BookOpen, Check, Pencil, X, Loader2,
  ArrowRight, LayoutGrid, Trash2
} from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';

export default function PlansView({ data }) {
  const { allPlans = [], activePlan } = data || {};
  const mutation = useDataMutation();
  const setCurrentView = useAppStore(state => state.setCurrentView);
  const setActivePlanId = useAppStore(state => state.setActivePlanId);

  // ── Create modal state ──
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // ── Edit state ──
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await mutation.mutateAsync({
        action: 'createPlan',
        plan: { id: crypto.randomUUID(), title: newTitle.trim(), description: newDesc.trim() }
      });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    } catch (e) {
      alert('Error creating plan: ' + e.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    setActivePlanId(planId);
    await mutation.mutateAsync({ action: 'setActivePlan', planId });
    setCurrentView('Today');
  };

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setEditTitle(plan.title);
    setEditDesc(plan.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDesc('');
  };

  const handleSaveEdit = async (planId) => {
    if (!editTitle.trim()) return;
    setIsSaving(true);
    try {
      await mutation.mutateAsync({
        action: 'updatePlan',
        planId,
        patch: { title: editTitle.trim(), description: editDesc.trim() }
      });
      cancelEdit();
    } catch (e) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#313c1a] tracking-tight">Plans</h2>
          <p className="text-[#627833] text-xs font-semibold mt-0.5 uppercase tracking-wide">
            {allPlans.length} workspace{allPlans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 px-4 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(119,191,163,0.3)]"
        >
          <Plus size={15} /> New Plan
        </button>
      </div>

      {/* Plans grid */}
      {allPlans.length === 0 ? (
        <div className="clay-card p-12 text-center border-2 border-dashed border-[#dde7c7]">
          <LayoutGrid size={36} className="mx-auto text-[#bfd8bd] mb-3" />
          <p className="font-semibold text-[#627833]">No plans yet.</p>
          <p className="text-sm text-[#98c9a3] mt-1">Create a new plan to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allPlans.map(plan => {
            const isActive = activePlan?.id === plan.id;
            const isEditing = editingId === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  isActive ? 'border-[#77bfa3] shadow-[0_0_0_3px_rgba(119,191,163,0.12)]' : 'border-[#edeec9] hover:border-[#bfd8bd]'
                }`}
              >
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      autoFocus
                      placeholder="Plan title"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(plan.id)}
                    />
                    <textarea
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#77bfa3] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(plan.id)}
                        disabled={isSaving || !editTitle.trim()}
                        className="flex-1 py-2.5 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save</>}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2.5 bg-[#f8faf4] hover:bg-[#edeec9] text-[#627833] font-bold rounded-xl text-sm border border-[#dde7c7] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'ring-2 ring-[#77bfa3]' : 'bg-[#edeec9]'
                        }`}>
                          <img src="/icon.jpg" alt="Plan" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#313c1a] text-base leading-snug">{plan.title}</h3>
                          {plan.description && (
                            <p className="text-xs text-[#627833] font-medium mt-0.5 line-clamp-1">{plan.description}</p>
                          )}
                        </div>
                      </div>
                      {/* Edit button */}
                      <button
                        onClick={() => startEdit(plan)}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#98c9a3] hover:text-[#3c7f65] hover:bg-[#f0f7f4] rounded-lg transition-all"
                        title="Edit plan"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>

                    {/* Tags row */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {isActive && (
                        <span className="text-[10px] font-bold text-[#3c7f65] bg-[#bfd8bd]/25 px-2.5 py-1 rounded-full border border-[#bfd8bd]/50 uppercase tracking-wide">
                          Active
                        </span>
                      )}
                      {plan.is_s4 && (
                        <span className="text-[10px] font-bold text-[#50a987] bg-[#f0f9f5] px-2.5 py-1 rounded-full border border-[#bfd8bd]/50 uppercase tracking-wide">
                          S4
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-[#98c9a3]">
                        {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Actions */}
                    {!isActive ? (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-[#3c7f65] bg-[#f0f7f4] hover:bg-[#bfd8bd]/30 border border-[#dde7c7] rounded-xl transition-all"
                      >
                        Switch to this plan <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#3c7f65] py-1">
                        <Check size={14} /> Currently active — go to <button onClick={() => setCurrentView('Today')} className="underline underline-offset-2 hover:text-[#50a987]">Today</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Plan Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#dde7c7] animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#313c1a] text-lg">New Plan</h3>
              <button
                onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); }}
                className="text-[#98c9a3] hover:text-[#313c1a] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">Plan Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. S5 Exam Prep, Placement Prep…"
                  className="w-full p-3 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#77bfa3]"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">Description <span className="text-[#b8cd8a] normal-case font-medium">(optional)</span></label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is this plan for?"
                  rows={3}
                  className="w-full p-3 rounded-xl border border-[#dde7c7] bg-[#f8faf4] text-[#313c1a] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#77bfa3] resize-none"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={isCreating || !newTitle.trim()}
                className="w-full py-3.5 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_4px_14px_rgba(119,191,163,0.3)]"
              >
                {isCreating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} /> Create Plan</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
