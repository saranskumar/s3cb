import React, { useState } from 'react';
import { Calendar, Check, ChevronRight, Loader2, Plus, X, BookOpen, ArrowRight } from 'lucide-react';
import SearchableSelect from '../ui/SearchableSelect';
import { useDataMutation } from '../../hooks/useData';
import { generateId } from '../../lib/utils';

const S4_EXAM_SLOTS = [
  { id: 'maths',     label: 'Mathematics',             date: '2026-04-27', code: 'GAMAT401' },
  { id: 'ai',        label: 'Artificial Intelligence', date: '2026-04-29', code: 'PCCMT402' },
  { id: 'os',        label: 'Operating Systems',       date: '2026-05-04', code: 'PCCST403' },
  { id: 'dbms',      label: 'DBMS',                    date: '2026-05-07', code: 'PBCMT404' },
  { id: 'adsa',      label: 'ADSA',                    date: '2026-05-11', code: 'PECST495' },
  { id: 'economics', label: 'Economics',               date: '2026-05-14', code: 'UCHUT346' },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
}

export default function PlanSetupView({ data, onComplete }) {
  const { activePlan, subjects, subjectTemplates = [] } = data || {};
  const mutation = useDataMutation();

  // Build slot state from existing subjects (already seeded by apply_s4_seed)
  const [slots, setSlots] = useState(() =>
    S4_EXAM_SLOTS.map(slot => {
      const attached = subjects?.find(s => s.template_subject_id === slot.id);
      return { ...slot, subjectId: attached?.id || null, subjectName: attached?.name || slot.label, confirmed: !!attached };
    })
  );

  const [saving, setSaving] = useState(false);
  const [swappingSlot, setSwappingSlot] = useState(null); // slot id being edited

  // Build options list for the searchable select
  const templateOptions = subjectTemplates.map(st => ({
    value: st.id,
    label: st.name,
    sub: st.code,
  }));

  const handleSwapSubject = async (slotTemplateId, newSubjectTemplateId, newLabel) => {
    if (!activePlan?.id || !newSubjectTemplateId) return;
    setSaving(true);
    try {
      await mutation.mutateAsync({
        action: 'attachSubjectToSlot',
        planId: activePlan.id,
        subjectTemplateId: newSubjectTemplateId,
      });
      setSlots(prev => prev.map(s =>
        s.id === slotTemplateId ? { ...s, subjectName: newLabel, confirmed: true } : s
      ));
      setSwappingSlot(null);
    } catch (e) {
      alert('Error swapping subject: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomSubject = async (slotTemplateId, name) => {
    if (!name?.trim() || !activePlan?.id) return;
    setSaving(true);
    try {
      const slot = slots.find(s => s.id === slotTemplateId);
      await mutation.mutateAsync({
        action: 'addSubject',
        subject: {
          id: generateId(),
          name: name.trim(),
          exam_date: slot?.date || null,
        },
        planId: activePlan.id,
      });
      setSlots(prev => prev.map(s =>
        s.id === slotTemplateId ? { ...s, subjectName: name.trim(), confirmed: true } : s
      ));
      setSwappingSlot(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };


  const confirmedCount = slots.filter(s => s.confirmed).length;

  return (
    <div className="min-h-screen bg-[#fdfdf9] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#edeec9] px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] overflow-hidden shadow-2xl mx-auto border-4 border-white bg-white">
          <img src="/icon-512.png" alt="KōA" className="w-full h-full object-cover" />
        </div>
            <span className="text-xs font-bold text-[#98c9a3] uppercase tracking-widest">Setup</span>
          </div>
          <h1 className="text-xl font-bold text-[#313c1a]">Your S4 Plan</h1>
          <p className="text-sm text-[#627833] font-medium mt-0.5">
            {confirmedCount} of {slots.length} subjects confirmed. Swap or keep defaults.
          </p>
        </div>
      </div>

      {/* Slots list */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-lg mx-auto space-y-3">
          {slots.map((slot, i) => {
            const days = daysUntil(slot.date);
            const isEditing = swappingSlot === slot.id;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${
                  slot.confirmed ? 'border-[#bfd8bd]' : 'border-[#edeec9]'
                }`}
              >
                {/* Slot header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                      slot.confirmed ? 'bg-[#77bfa3] text-white' : 'bg-[#edeec9] text-[#627833]'
                    }`}>
                      {slot.confirmed ? <Check size={14} /> : i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#313c1a] text-sm">{slot.subjectName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#98c9a3]">
                        <Calendar size={10} />
                        {formatDate(slot.date)}
                        <span className={`${days <= 5 ? 'text-red-400' : days <= 10 ? 'text-orange-400' : 'text-[#bfd8bd]'}`}>
                          · {Math.max(0, days)}d
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setSwappingSlot(slot.id)}
                      className="h-8 px-3 text-xs font-bold text-[#3c7f65] bg-[#f0f7f4] hover:bg-[#bfd8bd]/30 border border-[#dde7c7] rounded-lg transition-all"
                    >
                      Swap
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={() => setSwappingSlot(null)}
                      className="h-8 w-8 flex items-center justify-center text-[#98c9a3] hover:text-[#313c1a] rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Swap editor */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-[#f0f4ea]">
                    <p className="text-xs font-bold text-[#98c9a3] uppercase tracking-wide mb-2">Replace subject</p>
                    <SearchableSelect
                      options={templateOptions}
                      placeholder="Pick from library or type new…"
                      searchPlaceholder="Search subjects…"
                      allowCreate
                      onChange={(val, lb) => {
                        if (val) handleSwapSubject(slot.id, val, lb);
                      }}
                      onCreateNew={(name) => handleAddCustomSubject(slot.id, name)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add extra subject */}
          <div className="bg-white rounded-2xl border border-dashed border-[#dde7c7] p-4">
            <p className="text-xs font-bold text-[#98c9a3] uppercase tracking-wide mb-2">Add Extra Subject</p>
            <SearchableSelect
              options={templateOptions}
              placeholder="Search or create a subject…"
              searchPlaceholder="e.g. Microeconomics…"
              allowCreate
              onChange={(val) => {
                if (val) {
                  mutation.mutate({
                    action: 'attachSubjectToSlot',
                    planId: activePlan?.id,
                    subjectTemplateId: val,
                  });
                }
              }}
              onCreateNew={(name) => {
                if (!name?.trim() || !activePlan?.id) return;
                mutation.mutate({
                  action: 'addSubject',
                  subject: { id: generateId(), name: name.trim() },
                  planId: activePlan.id,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-white border-t border-[#edeec9] px-4 pt-4 pb-6 safe-area-inset-bottom space-y-3">
        <div className="max-w-lg mx-auto space-y-3">
          <button
            onClick={onComplete}
            disabled={saving}
            className="w-full py-4 bg-[#3c7f65] hover:bg-[#2d5a4c] text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(60,127,101,0.4)] disabled:opacity-50 disabled:bg-[#98c9a3]"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <>Start Studying <ArrowRight size={18} /></>}
          </button>
          
          <p className="text-center text-xs text-[#b8cd8a] font-medium">
            You can always add or change subjects later in the Subjects tab.
          </p>
        </div>
      </div>
    </div>
  );
}

