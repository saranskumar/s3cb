/**
 * UI helpers for consistent styling across the S4 Execution Center
 */

export const getPriorityColor = (priority) => {
  const p = String(priority || '').toLowerCase();
  if (p === 'critical' || p === 'make_or_break') return 'text-red-400 bg-red-950/30 border-red-900/50';
  if (p === 'high' || p === 'score_booster') return 'text-amber-400 bg-amber-950/30 border-amber-900/50';
  if (p === 'medium' || p === 'balanced') return 'text-slate-300 bg-slate-800/50 border-slate-700/50';
  if (p === 'advantage' || p === 'free_marks') return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
  return 'text-slate-400 bg-slate-900/50 border-slate-800';
};

export const getTaskTypeIcon = (type) => {
  const t = String(type || '').toLowerCase();
  if (t === 'writing') return '✍️';
  if (t === 'solving') return '🔢';
  if (t === 'pyq') return '📜';
  if (t === 'mock') return '🎯';
  if (t === 'revision') return '🔄';
  return '📖';
};

/**
 * Common logic for Output Blocks
 */
export function getOutputBlockMeta(task) {
  if (!task.isOutputBlock && !String(task.title).toLowerCase().includes('output block')) {
    return null;
  }
  
  return {
    className: 'border-indigo-500/50 bg-indigo-950/10',
    label: 'Output Block',
    accentColor: 'indigo',
    rules: [
      'Write 2 full answers',
      'Solve 10+ problems if relevant',
      'Note weak points found'
    ]
  };
}
