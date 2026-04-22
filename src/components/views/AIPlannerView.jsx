import React, { useState, useEffect, useMemo } from 'react';
import { useDataMutation } from '../../hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import {
  Copy, Check, AlertCircle, ArrowLeft, Upload,
  Loader2, ClipboardPaste, Sparkles, Bot, Calendar
} from 'lucide-react';

// ─── Prompt builder from existing plan data ───────────────────────────────────
function buildPrompt(subjects, modules, topics) {
  const today = new Date().toLocaleDateString('en-CA');

  const syllabusBlock = subjects.map(sub => {
    const subModules = modules.filter(m => m.subject_id === sub.id);
    const moduleLines = subModules.map(mod => {
      const modTopics = topics.filter(t => t.module_id === mod.id);
      const topicList = modTopics.length > 0
        ? modTopics.map(t => `        - ${t.title || t.name}`).join('\n')
        : '        - (no topics defined)';
      return `    Module: ${mod.title}\n${topicList}`;
    }).join('\n');
    return `  Subject: ${sub.name}\n  Exam Date: ${sub.exam_date || 'NOT SET — YOU MUST ADD THIS'}\n${moduleLines || '    (no modules defined)'}`;
  }).join('\n\n');

  return `You are an expert academic study planner.

Create a COMPLETE and BALANCED daily study plan based on the syllabus below.

TODAY'S DATE: ${today}

==================================================
MY SYLLABUS (DO NOT CHANGE — use exact names)
==================================================

${syllabusBlock}

==================================================
STRICT RULES
==================================================

1. FULL COVERAGE
   * Every topic MUST appear at least once in the study_plan.
   * Important topics should appear multiple times (initial study + revision).

2. DISTRIBUTION
   * Spread sessions across all days before each subject's exam.
   * Prioritize subjects with earlier exam dates.
   * Do NOT schedule anything ON or AFTER a subject's exam date.

3. SESSION STRUCTURE
   * Duration: 60–120 minutes per session.
   * Each session covers one topic or a small cluster of related topics.

4. REVISION STRATEGY
   * Include at least 1 revision session per subject before the exam.
   * Include a final revision 1–2 days before the exam.
   * Label clearly: "Revision: ..." or "Final Revision: ..."

5. PRACTICE SESSIONS
   * Include problem-solving, PYQs, and answer-writing sessions.
   * At least every 2–3 days per subject.
   * Label clearly: "Practice: ..." or "PYQs: ..."

6. PRIORITY
   * "high" → exam within 7 days
   * "medium" → 8–14 days
   * "low" → 15+ days

7. DATA CONSISTENCY (CRITICAL)
   * The "subject" field MUST EXACTLY match a subject name from the syllabus above.
   * The "module" field MUST EXACTLY match a module name from the syllabus above.
   * The "topic" field MUST EXACTLY match a topic name from the syllabus above.

==================================================
OUTPUT FORMAT (STRICT)
==================================================

Return ONLY valid JSON. No markdown, no explanations, no code blocks.

{
  "study_plan": [
    {
      "date": "YYYY-MM-DD",
      "subject": "exact subject name",
      "module": "exact module name",
      "topic": "exact topic name",
      "title": "Deep Dive: Topic Name",
      "planned_minutes": 90,
      "priority": "high"
    }
  ]
}

==================================================
VALIDATION BEFORE RETURNING
==================================================

* Every topic appears at least once.
* No invalid subject/module/topic references (must match syllabus exactly).
* Dates are valid — nothing scheduled on or after exam dates.
* Sessions increase in intensity closer to exams.
`;
}

// ─── Step indicator ────────────────────────────────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2.5 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
        done ? 'bg-[#3c7f65] text-white' : active ? 'bg-[#77bfa3] text-white ring-4 ring-[#77bfa3]/20' : 'bg-[#edeec9] text-[#627833]'
      }`}>
        {done ? <Check size={13} /> : n}
      </div>
      <span className={`text-xs font-bold ${active ? 'text-[#313c1a]' : 'text-[#627833]'}`}>{label}</span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AIPlannerView({ data, onClose }) {
  const { subjects = [], modules = [], topics = [], activePlan } = data || {};

  const [step, setStep] = useState(1);
  const [promptCopied, setPromptCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useDataMutation();

  // Only subjects for the active plan
  const planSubjects = useMemo(() =>
    subjects.filter(s => s.plan_id === activePlan?.id),
    [subjects, activePlan]
  );

  const planModules = useMemo(() =>
    modules.filter(m => m.plan_id === activePlan?.id),
    [modules, activePlan]
  );

  const planTopics = useMemo(() =>
    topics.filter(t => t.plan_id === activePlan?.id),
    [topics, activePlan]
  );

  const prompt = useMemo(() =>
    buildPrompt(planSubjects, planModules, planTopics),
    [planSubjects, planModules, planTopics]
  );

  const hasExamDates = planSubjects.every(s => s.exam_date);

  // ── Copy prompt ──
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setStep(2), 1200);
    } catch {
      alert('Could not copy. Please select + copy the prompt text manually.');
    }
  };

  // ── Validate JSON ──
  useEffect(() => {
    if (!jsonInput.trim()) { setValidationResult(null); return; }

    try {
      const data = JSON.parse(jsonInput);

      if (!Array.isArray(data.study_plan) || data.study_plan.length === 0)
        throw new Error("'study_plan' must be a non-empty array");

      const subjectNames = new Set(planSubjects.map(s => s.name));
      let sessionCount = 0;

      for (const task of data.study_plan) {
        if (!task.date || !task.subject || !task.title || !task.planned_minutes)
          throw new Error(`A task is missing required fields (date/subject/title/planned_minutes)`);
        if (!subjectNames.has(task.subject))
          throw new Error(`Subject "${task.subject}" not found in your plan. Must match exactly.`);
        sessionCount++;
      }

      setValidationResult({
        valid: true,
        data,
        summary: `${sessionCount} sessions across ${new Set(data.study_plan.map(t => t.subject)).size} subjects`
      });

      setStep(3);
    } catch (err) {
      setValidationResult({ valid: false, error: err.message });
    }
  }, [jsonInput, planSubjects]);

  // ── Import ──
  const handleImport = async () => {
    if (!validationResult?.valid) return;
    setIsProcessing(true);
    try {
      await mutation.mutateAsync({
        action: 'importAITasks',
        payload: {
          planId: activePlan.id,
          tasks: validationResult.data.study_plan,
          subjects: planSubjects,
          modules: planModules,
          topics: planTopics
        }
      });
      queryClient.invalidateQueries({ queryKey: ['appData'] });
      onClose();
    } catch (err) {
      alert('Import failed: ' + err.message);
      setIsProcessing(false);
    }
  };

  if (planSubjects.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdfdf9] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-[#f8faf4] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#edeec9]">
            <Bot size={28} className="text-[#bfd8bd]" />
          </div>
          <h2 className="text-xl font-black text-[#313c1a] mb-2">No Subjects Found</h2>
          <p className="text-[#627833] text-sm mb-6">Add subjects to your plan first before generating an AI study schedule.</p>
          <button onClick={onClose} className="px-6 py-3 bg-[#77bfa3] text-white font-bold rounded-xl">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdf9]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="relative text-center">
          <button
            onClick={onClose}
            className="absolute left-0 top-1.5 w-10 h-10 rounded-xl bg-white border border-[#edeec9] flex items-center justify-center text-[#627833] hover:bg-[#f8faf4] transition-colors shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#bfd8bd] to-[#77bfa3] flex items-center justify-center rounded-2xl mb-3 shadow-md">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#313c1a]">AI Study Planner</h1>
          <p className="text-[#627833] text-sm mt-1">Generates a full schedule for <strong>{activePlan?.title}</strong></p>
        </div>

        {/* Missing exam dates warning */}
        {!hasExamDates && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Calendar size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-bold text-sm">Exam dates missing</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Some subjects don't have exam dates set. The AI prompt includes a placeholder — you can edit dates in the prompt before sending, or set them in Subjects first.
              </p>
            </div>
          </div>
        )}

        {/* Subject preview */}
        <div className="bg-white rounded-2xl border border-[#edeec9] p-4">
          <p className="text-[10px] font-black text-[#627833] uppercase tracking-widest mb-3">
            {planSubjects.length} Subjects in prompt
          </p>
          <div className="space-y-2">
            {planSubjects.map(sub => {
              const subModules = planModules.filter(m => m.subject_id === sub.id);
              const subTopics = planTopics.filter(t => t.subject_id === sub.id);
              return (
                <div key={sub.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#77bfa3] flex-shrink-0" />
                    <span className="font-bold text-[#313c1a]">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#98c9a3] font-medium">
                      {subModules.length}M · {subTopics.length}T
                    </span>
                    <span className={`text-[10px] font-bold ${sub.exam_date ? 'text-[#3c7f65]' : 'text-amber-500'}`}>
                      {sub.exam_date
                        ? new Date(sub.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'No date'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step tracker */}
        <div className="flex items-center gap-2 px-1">
          <Step n={1} label="Copy prompt" active={step === 1} done={step > 1} />
          <div className="flex-1 h-px bg-[#edeec9]" />
          <Step n={2} label="Paste AI response" active={step === 2} done={step > 2} />
          <div className="flex-1 h-px bg-[#edeec9]" />
          <Step n={3} label="Import" active={step === 3} done={false} />
        </div>

        {/* ── STEP 1: Copy prompt ── */}
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${step === 1 ? 'border-[#77bfa3] shadow-[0_0_0_4px_rgba(119,191,163,0.08)]' : 'border-[#edeec9]'}`}>
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#3c7f65] text-white rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black">1</div>
            <div>
              <h2 className="font-bold text-[#313c1a] text-base">Get your AI schedule</h2>
              <ul className="text-[#627833] text-sm mt-2 space-y-1.5 leading-relaxed list-decimal list-inside pr-2">
                <li><strong>Copy</strong> the prompt below (includes your full syllabus).</li>
                <li><strong>Paste</strong> into ChatGPT, Claude, or Gemini.</li>
                <li><strong>Copy</strong> the AI's JSON response and paste it in Step 2.</li>
              </ul>
            </div>
          </div>
          <div className="p-5 bg-[#f8faf4] border-t border-[#f0f4ea]">
            <button
              onClick={handleCopyPrompt}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                promptCopied
                  ? 'bg-[#3c7f65] text-white'
                  : 'bg-[#77bfa3] hover:bg-[#50a987] text-white shadow-[0_4px_16px_rgba(119,191,163,0.25)]'
              }`}
            >
              {promptCopied ? <><Check size={18} /> Copied! Open your AI now</> : <><Copy size={18} /> Copy Prompt (with your syllabus)</>}
            </button>
            <p className="text-center text-[#8aad60] text-[10px] uppercase font-bold tracking-wider mt-3">
              Includes: {planSubjects.length} subjects · {planModules.length} modules · {planTopics.length} topics
            </p>
          </div>
        </div>

        {/* ── STEP 2: Paste AI response ── */}
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${step >= 2 ? 'border-[#77bfa3] shadow-[0_0_0_4px_rgba(119,191,163,0.08)]' : 'border-[#edeec9] opacity-40 pointer-events-none'}`}>
          <div className="p-4 flex items-start gap-3 border-b border-[#f0f4ea]">
            <div className="w-8 h-8 bg-[#3c7f65] text-white rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black">2</div>
            <div>
              <h2 className="font-bold text-[#313c1a] text-sm">Paste AI response here</h2>
              <p className="text-[#8aad60] text-xs mt-0.5">The app validates it automatically as you paste.</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); }}
                placeholder={'Paste the JSON from your AI here…\n\n{\n  "study_plan": [\n    { "date": "YYYY-MM-DD", "subject": "...", ... }\n  ]\n}'}
                className="w-full h-44 p-3 bg-[#f8faf4] text-[#3c7f65] font-mono border border-[#edeec9] shadow-inner rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77bfa3] focus:bg-white transition-colors text-[11px] leading-relaxed"
              />
              {!jsonInput && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-1.5 opacity-20">
                    <ClipboardPaste size={28} className="text-[#77bfa3]" />
                    <span className="text-[#77bfa3] text-xs font-bold">Paste here</span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation badge */}
            {jsonInput.trim() && validationResult && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border text-xs animate-in slide-in-from-bottom-2 duration-200 ${
                validationResult.valid ? 'bg-[#f0f7f4] border-[#bfd8bd]' : 'bg-red-50 border-red-200'
              }`}>
                {validationResult.valid
                  ? <Check size={15} className="text-[#3c7f65] mt-0.5 flex-shrink-0" />
                  : <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                }
                <div>
                  <p className={`font-bold ${validationResult.valid ? 'text-[#3c7f65]' : 'text-red-700'}`}>
                    {validationResult.valid ? '✓ Valid — ready to import' : 'Format error'}
                  </p>
                  <p className={`mt-0.5 ${validationResult.valid ? 'text-[#627833]' : 'text-red-600'}`}>
                    {validationResult.valid ? validationResult.summary : validationResult.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 3: Import ── */}
        <button
          onClick={handleImport}
          disabled={!validationResult?.valid || isProcessing}
          className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm ${
            validationResult?.valid && !isProcessing
              ? 'bg-[#3c7f65] hover:bg-[#2d5a4c] text-white shadow-[0_4px_20px_rgba(60,127,101,0.35)]'
              : 'bg-[#dde7c7] text-[#98c9a3] cursor-not-allowed'
          }`}
        >
          {isProcessing
            ? <><Loader2 size={18} className="animate-spin" /> Scheduling your sessions…</>
            : validationResult?.valid
              ? <><Upload size={18} /> Add Sessions to Planner <Check size={16} /></>
              : 'Paste valid AI JSON to continue'
          }
        </button>

      </div>
    </div>
  );
}
