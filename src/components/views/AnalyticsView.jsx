import React from 'react';
import {
  TrendingUp, BookOpen, CheckCircle, AlertCircle,
  Calendar, Flame, Target, BarChart2, Clock
} from 'lucide-react';

function StatPill({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#edeec9] shadow-sm text-center">
      <div className={`text-2xl md:text-3xl font-bold ${accent || 'text-[#313c1a]'}`}>{value}</div>
      {sub && <div className="text-[#3c7f65] font-bold text-sm mt-0.5">{sub}</div>}
      <div className="text-[#627833] text-xs font-semibold uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

export default function AnalyticsView({ data }) {
  const { subjects, topics, tasks, dashboard } = data || {};
  const { streak, weekActivity, nextExam } = dashboard || {};

  // ── Overall numbers ──────────────────────────────────────────────────────────
  const totalTopics = topics?.length || 0;
  const completedTopics = topics?.filter(t =>
    t.status === 'done' || t.status === 'mastered' || t.status === 'revise_1' || t.status === 'revise_2'
  ).length || 0;
  const pendingTopics = totalTopics - completedTopics;
  const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const tasksCompletedToday = tasks?.filter(t => t.date === todayStr && t.status === 'completed').length || 0;
  const tasksCompletedWeek = tasks?.filter(t => t.date >= weekStartStr && t.status === 'completed').length || 0;

  // ── Subject analytics ─────────────────────────────────────────────────────────
  const subjectStats = subjects?.map(sub => {
    const subTopics = topics?.filter(t => t.subject_id === sub.id) || [];
    const done = subTopics.filter(t =>
      t.status === 'done' || t.status === 'mastered' || t.status === 'revise_1' || t.status === 'revise_2'
    ).length;
    const pct = subTopics.length > 0 ? Math.round((done / subTopics.length) * 100) : 0;
    const daysLeft = sub.exam_date
      ? Math.ceil((new Date(sub.exam_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
    const overdueCount = tasks?.filter(t => t.subject_id === sub.id && t.date < todayStr && t.status === 'pending').length || 0;
    return { ...sub, total: subTopics.length, done, pct, daysLeft, overdueCount };
  }).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999)) || [];

  // ── Weekly bar chart ───────────────────────────────────────────────────────────
  const maxWeekVal = Math.max(...(weekActivity || []).map(d => d.completed), 1);

  return (
    <div className="space-y-8 pb-28 animate-in fade-in duration-300">

      {/* Page header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#313c1a] tracking-tight">Progress</h2>
        <p className="text-[#627833] text-sm font-medium mt-1">Your S4 preparation snapshot</p>
      </div>

      {/* ── Section 1: Overall stats ── */}
      <section>
        <h3 className="text-xs font-bold text-[#98c9a3] uppercase tracking-widest mb-4">Overall</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatPill label="Subjects" value={subjects?.length || 0} />
          <StatPill label="Total Topics" value={totalTopics} />
          <StatPill label="Completed" value={completedTopics} accent="text-[#3c7f65]" />
          <StatPill label="Pending" value={pendingTopics} accent="text-[#627833]" />
          <StatPill
            label="Completion"
            value={`${overallPct}%`}
            accent={overallPct >= 50 ? 'text-[#3c7f65]' : 'text-[#627833]'}
          />
          <StatPill
            label="Streak"
            value={streak || 0}
            sub="days"
            accent="text-[#77bfa3]"
          />
        </div>
        {/* Overall ring */}
        <div className="mt-4 clay-card p-6 flex items-center gap-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#edeec9" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#77bfa3" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallPct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-[#3c7f65] text-lg">{overallPct}%</div>
          </div>
          <div>
            <div className="font-bold text-[#313c1a] text-lg">Overall Completion</div>
            <div className="text-[#627833] text-sm font-medium mt-1">{completedTopics} of {totalTopics} topics done across all subjects</div>
            {nextExam && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#50a987]">
                <Calendar size={12} />
                Next exam: {nextExam.name} in {Math.max(0, nextExam.daysLeft)} days
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Subject-wise progress ── */}
      <section>
        <h3 className="text-xs font-bold text-[#98c9a3] uppercase tracking-widest mb-4">Subject Breakdown</h3>
        <div className="space-y-3">
          {subjectStats.map(sub => (
            <div key={sub.id} className="clay-card p-5">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[#313c1a]">{sub.name}</h4>
                    {sub.overdueCount > 0 && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        {sub.overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#627833] font-medium mt-0.5">
                    {sub.done}/{sub.total} topics · {sub.exam_date && new Date(sub.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {sub.daysLeft !== null && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      sub.daysLeft <= 3 ? 'text-red-500 bg-red-50 border-red-200' :
                      sub.daysLeft <= 7 ? 'text-orange-500 bg-orange-50 border-orange-200' :
                      'text-[#50a987] bg-[#bfd8bd]/20 border-[#dde7c7]'
                    }`}>
                      {sub.daysLeft <= 0 ? 'Today!' : `${sub.daysLeft}d`}
                    </span>
                  )}
                  <span className={`text-lg font-bold ${sub.pct >= 50 ? 'text-[#3c7f65]' : 'text-[#627833]'}`}>{sub.pct}%</span>
                </div>
              </div>
              <div className="h-2 bg-[#edeec9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    sub.pct >= 70 ? 'bg-gradient-to-r from-[#77bfa3] to-[#50a987]' :
                    sub.pct >= 30 ? 'bg-[#bfd8bd]' : 'bg-[#dde7c7]'
                  }`}
                  style={{ width: `${sub.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Weekly activity ── */}
      <section>
        <h3 className="text-xs font-bold text-[#98c9a3] uppercase tracking-widest mb-4">Weekly Activity</h3>
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-[#3c7f65]">{tasksCompletedToday}</span>
              <span className="text-[#627833] font-semibold text-sm ml-2">done today</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[#313c1a]">{tasksCompletedWeek}</span>
              <span className="text-[#627833] text-sm font-medium ml-1">this week</span>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-24 mt-4">
            {(weekActivity || []).map((day, i) => {
              const barHeight = maxWeekVal > 0 ? Math.max((day.completed / maxWeekVal) * 100, day.completed > 0 ? 8 : 0) : 0;
              const isToday = day.date === todayStr;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday ? 'bg-[#77bfa3]' : day.completed > 0 ? 'bg-[#bfd8bd]' : 'bg-[#edeec9]'
                      }`}
                      style={{ height: `${barHeight}%`, minHeight: '4px' }}
                      title={`${day.completed} tasks`}
                    />
                  </div>
                  <div className={`text-[10px] font-bold ${isToday ? 'text-[#3c7f65]' : 'text-[#98c9a3]'}`}>{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 4: Upcoming pressure ── */}
      <section>
        <h3 className="text-xs font-bold text-[#98c9a3] uppercase tracking-widest mb-4">Exam Pressure</h3>
        <div className="space-y-3">
          {subjectStats.filter(s => s.daysLeft !== null && s.daysLeft >= 0).slice(0, 4).map(sub => {
            const isRisky = sub.pct < 30 && (sub.daysLeft || 999) < 10;
            return (
              <div key={sub.id} className={`clay-card p-4 border-l-4 ${
                isRisky ? 'border-l-red-400 bg-red-50/20' :
                (sub.daysLeft || 999) <= 5 ? 'border-l-orange-400' :
                'border-l-[#77bfa3]'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#313c1a]">{sub.name}</div>
                    <div className="text-xs text-[#627833] font-medium mt-0.5">{sub.pct}% done · {sub.done}/{sub.total} topics</div>
                    {isRisky && (
                      <div className="flex items-center gap-1 mt-1 text-xs font-bold text-red-500">
                        <AlertCircle size={11} /> Low coverage, exam soon
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      (sub.daysLeft || 999) <= 3 ? 'text-red-500' :
                      (sub.daysLeft || 999) <= 7 ? 'text-orange-500' :
                      'text-[#3c7f65]'
                    }`}>{sub.daysLeft}d</div>
                    <div className="text-[10px] font-bold text-[#98c9a3] uppercase">until exam</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
