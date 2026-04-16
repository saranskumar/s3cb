import React from 'react';

export default function AnalyticsView({ data }) {
  if (!data?.analytics) return <div className="p-4 text-slate-400">Loading analytics...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel p-6 rounded-xl">
        <h3 className="font-bold text-slate-200 text-lg mb-4">Analytics Dashboard</h3>
        <p className="text-slate-400 text-sm">Advanced metrics and weekly summaries will be populated here based on session logs and mock tests.</p>
      </div>
    </div>
  );
}
