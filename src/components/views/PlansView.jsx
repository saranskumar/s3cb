import React, { useState } from 'react';
import {
  Plus, BookOpen, Check, Pencil, X, Loader2,
  ArrowRight, LayoutGrid, Trash2, Calendar, Settings2
} from 'lucide-react';
import { useDataMutation } from '../../hooks/useData';
import { useAppStore } from '../../store/useAppStore';
import { generateId } from '../../lib/utils';
import SearchableSelect from '../ui/SearchableSelect';

function formatDate(d) {
  if (!d) return 'No date';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────
// Subject Manager Modal
// ─────────────────────────────────────────────
function SubjectManagerModal({ plan, subjects, subjectTemplates = [], onClose, mutation }) {
  const [localSubjects, setLocalSubjects] = useState(() =>
    subjects.filter(s => s.plan_id === plan.id).map(s => ({ ...s }))
  );
  const [swappingId, setSwappingId] = useState(null); // subject id being swapped
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const templateOptions = subjectTemplates.map(st => ({
    value: st.id,
    label: st.name,
    sub: st.code,
  }));

  // ── Update exam date inline ──
  const handleDateChange = async (subject, newDate) => {
    // Optimistic update
    setLocalSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, exam_date: newDate } : s));
    try {
      await mutation.mutateAsync({
        action: 'updateSubject',
        subjectId: subject.id,
        patch: { exam_date: newDate || null },
      });
    } catch (e) {
      // Rollback
      setLocalSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, exam_date: subject.exam_date } : s));
      alert('Failed to update date: ' + e.message);
    }
  };

  // ── Swap subject (replace with template or create custom) ──
  const handleSwap = async (subjectId, templateId, label, isCustom = false) => {
    if (!templateId && !label) return;
    setSaving(true);
    try {
      if (isCustom) {
        // Create a brand-new subject row
        const newSub = await mutation.mutateAsync({
          action: 'addSubject',
          planId: plan.id,
          subject: {
            id: generateId(),
            name: label,
            exam_date: null,
            template_subject_id: 'custom',
          },
        });
        // Delete the old one
        await mutation.mutateAsync({ action: 'deleteSubject', subjectId });
        setLocalSubjects(prev => [
          ...prev.filter(s => s.id !== subjectId),
          { ...newSub, name: label, exam_date: null },
        ]);
      } else {
        // Rename and re-link
        await mutation.mutateAsync({
          action: 'updateSubject',
          subjectId,
          patch: { name: label, template_subject_id: templateId },
        });
        setLocalSubjects(prev => prev.map(s =>
          s.id === subjectId ? { ...s, name: label, template_subject_id: templateId } : s
        ));
      }
      setSwappingId(null);
    } catch (e) {
      alert('Swap failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete subject ──
  const handleDelete = async (subjectId) => {
    if (!window.confirm('Remove this subject from the plan?')) return;
    setSaving(true);
    try {
      await mutation.mutateAsync({ action: 'deleteSubject', subjectId });
      setLocalSubjects(prev => prev.filter(s => s.id !== subjectId));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Add new subject ──
  const handleAdd = async (templateId, label, isCustom = false) => {
    if (!label) return;
    setSaving(true);
    try {
      const newSub = await mutation.mutateAsync({
        action: 'addSubject',
        planId: plan.id,
        subject: {
          id: crypto.randomUUID(),
          name: label,
          exam_date: null,
          template_subject_id: isCustom ? 'custom' : templateId,
        },
      });
      setLocalSubjects(prev => [...prev, { ...newSub, name: label, exam_date: null }]);
      setAddingNew(false);
    } catch (e) {
      alert('Add failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[#fdfdf9] w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#dde7c7] flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#edeec9]">
          <div>
            <h3 className="font-bold text-[#313c1a] text-base">Manage Subjects</h3>
            <p className="text-xs text-[#627833] font-medium mt-0.5 opacity-75">{plan.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#98c9a3] hover:text-[#313c1a] hover:bg-[#edeec9]/50 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subject list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {localSubjects.length === 0 && !addingNew && (
            <div className="text-center py-10 text-[#98c9a3]">
              <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-sm">No subjects yet</p>
              <p className="text-xs mt-1 opacity-70">Add your first subject below</p>
            </div>
          )}

          {localSubjects.map((subject, i) => {
            const days = daysUntil(subject.exam_date);
            const isSwapping = swappingId === subject.id;

            return (
              <div
                key={subject.id}
                className="bg-white rounded-2xl border border-[#edeec9] p-4 transition-all"
              >
                {/* Subject row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-[#dde7c7] text-[#627833] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#313c1a] text-sm truncate">{subject.name}</div>
                      {/* Inline date picker */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar size={10} className="text-[#98c9a3] flex-shrink-0" />
                        <input
                          type="date"
                          defaultValue={subject.exam_date || ''}
                          onChange={e => handleDateChange(subject, e.target.value)}
                          className="text-[11px] font-semibold text-[#627833] bg-transparent border-none outline-none cursor-pointer hover:text-[#3c7f65] transition-colors"
                        />
                        {days !== null && (
                          <span className={`text-[10px] font-bold ${
                            days < 0 ? 'text-gray-400' :
                            days <= 5 ? 'text-red-400' :
                            days <= 10 ? 'text-orange-400' :
                            'text-[#bfd8bd]'
                          }`}>
                            {days < 0 ? 'Past' : `${days}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!isSwapping && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setSwappingId(subject.id)}
                        disabled={saving}
                        className="h-8 px-2.5 text-[10px] font-bold text-[#3c7f65] bg-[#f0f7f4] hover:bg-[#bfd8bd]/30 border border-[#dde7c7] rounded-lg transition-all disabled:opacity-40 uppercase tracking-wide"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        disabled={saving}
                        className="h-8 w-8 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {isSwapping && (
                    <button
                      onClick={() => setSwappingId(null)}
                      className="h-8 w-8 flex items-center justify-center text-[#98c9a3] hover:text-[#313c1a] rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Swap editor */}
                {isSwapping && (
                  <div className="mt-3 pt-3 border-t border-[#f0f4ea] space-y-2 animate-in slide-in-from-top-1 duration-200">
                    <p className="text-[10px] font-bold text-[#98c9a3] uppercase tracking-wide">Replace with</p>
                    <SearchableSelect
                      options={templateOptions}
                      placeholder="Pick from library or type new…"
                      searchPlaceholder="Search subjects…"
                      allowCreate
                      onChange={(val, lb) => {
                        if (val) handleSwap(subject.id, val, lb, false);
                      }}
                      onCreateNew={(name) => handleSwap(subject.id, null, name, true)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new — inline select */}
          {addingNew && (
            <div className="bg-white rounded-2xl border-2 border-[#77bfa3] p-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[#3c7f65] uppercase tracking-wide">Add Subject</p>
                <button onClick={() => setAddingNew(false)} className="text-[#98c9a3] hover:text-[#313c1a]">
                  <X size={14} />
                </button>
              </div>
              <SearchableSelect
                options={templateOptions}
                placeholder="Pick from library or type new…"
                searchPlaceholder="Search subjects…"
                allowCreate
                onChange={(val, lb) => {
                  if (val) handleAdd(val, lb, false);
                }}
                onCreateNew={(name) => handleAdd(null, name, true)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#edeec9] flex items-center gap-3">
          {!addingNew ? (
            <button
              onClick={() => setAddingNew(true)}
              disabled={saving}
              className="flex-1 py-3 flex items-center justify-center gap-2 bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold text-sm rounded-xl transition-all shadow-[0_2px_8px_rgba(119,191,163,0.3)] disabled:opacity-50"
            >
              <Plus size={16} /> Add Subject
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="flex-1 py-3 flex items-center justify-center bg-[#f8faf4] hover:bg-[#edeec9] text-[#627833] font-bold text-sm rounded-xl border border-[#dde7c7] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main PlansView
// ─────────────────────────────────────────────
export default function PlansView({ data }) {
  const { allPlans = [], activePlan, subjectTemplates = [], raw } = data || {};
  const subjects = raw?.allSubjects || [];
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

  // ── Subject manager state ──
  const [managingPlan, setManagingPlan] = useState(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await mutation.mutateAsync({
        action: 'createPlan',
        plan: { id: generateId(), title: newTitle.trim(), description: newDesc.trim() }
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
            const planSubjects = subjects.filter(s => s.plan_id === plan.id);

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
                          <img src="/icon-512.png" alt="Plan" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#313c1a] text-base leading-snug">{plan.title}</h3>
                          {plan.description && (
                            <p className="text-xs text-[#627833] font-medium mt-0.5 line-clamp-1">{plan.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Manage Subjects button */}
                        <button
                          onClick={() => setManagingPlan(plan)}
                          className="w-8 h-8 flex items-center justify-center text-[#98c9a3] hover:text-[#3c7f65] hover:bg-[#f0f7f4] rounded-lg transition-all"
                          title="Manage subjects"
                        >
                          <Settings2 size={14} />
                        </button>
                        {/* Edit plan title */}
                        <button
                          onClick={() => startEdit(plan)}
                          className="w-8 h-8 flex items-center justify-center text-[#98c9a3] hover:text-[#3c7f65] hover:bg-[#f0f7f4] rounded-lg transition-all"
                          title="Edit plan"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Tags row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
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

                    {/* Subject chips preview */}
                    {planSubjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {planSubjects.slice(0, 4).map(s => (
                          <span key={s.id} className="text-[10px] font-semibold text-[#627833] bg-[#f0f7f4] border border-[#dde7c7] px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <BookOpen size={9} />
                            {s.name}
                          </span>
                        ))}
                        {planSubjects.length > 4 && (
                          <span className="text-[10px] font-semibold text-[#98c9a3] px-2 py-0.5">
                            +{planSubjects.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!isActive ? (
                        <button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-[#3c7f65] bg-[#f0f7f4] hover:bg-[#bfd8bd]/30 border border-[#dde7c7] rounded-xl transition-all"
                        >
                          Switch to this plan <ArrowRight size={14} />
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center gap-2 text-xs font-bold text-[#3c7f65] py-1">
                          <Check size={14} /> Currently active —{' '}
                          <button onClick={() => setCurrentView('Today')} className="underline underline-offset-2 hover:text-[#50a987]">
                            go to Today
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => setManagingPlan(plan)}
                        className="px-3 py-2.5 flex items-center gap-1.5 text-[10px] font-bold text-[#627833] bg-[#f8faf4] hover:bg-[#edeec9] border border-[#dde7c7] rounded-xl transition-all uppercase tracking-wide"
                      >
                        <Settings2 size={12} /> Subjects
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Manager Modal */}
      {managingPlan && (
        <SubjectManagerModal
          plan={managingPlan}
          subjects={subjects}
          subjectTemplates={subjectTemplates}
          mutation={mutation}
          onClose={() => setManagingPlan(null)}
        />
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
                <label className="block text-xs font-bold text-[#627833] uppercase tracking-wider mb-2">
                  Description <span className="text-[#b8cd8a] normal-case font-medium">(optional)</span>
                </label>
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
