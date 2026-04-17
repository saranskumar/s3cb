import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { generateRandomName } from '../lib/names';

// ─── Streak calculation ───────────────────────────────────────────────────────
function calculateStreak(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const completedDates = new Set(
    tasks.filter(t => t.status === 'completed').map(t => t.date)
  );
  let streak = 0;
  let curr = new Date();
  curr.setHours(0, 0, 0, 0);
  for (let i = 0; i < 366; i++) {
    const dateStr = curr.toISOString().split('T')[0];
    if (completedDates.has(dateStr)) {
      streak++;
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      if (dateStr === todayStr) { curr.setDate(curr.getDate() - 1); continue; }
      break;
    }
    curr.setDate(curr.getDate() - 1);
  }
  return streak;
}

// ─── Main data hook ───────────────────────────────────────────────────────────
export function useAppData(userId) {
  const activePlanId = useAppStore(state => state.activePlanId);

  return useQuery({
    queryKey: ['appData', userId, activePlanId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch profile first to get active_plan_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      const resolvedPlanId = activePlanId || profile.active_plan_id;

      // Parallel fetch: user data + public templates
      const [subjectsRes, modulesRes, topicsRes, tasksRes, plansRes, subjectTemplatesRes, examSlotsRes, prefRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('modules').select('*').eq('user_id', userId).order('module_no', { ascending: true }),
        supabase.from('topics').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('study_plan').select('*').eq('user_id', userId),
        supabase.from('plans').select('*').eq('user_id', userId),
        supabase.from('subject_templates').select('*').order('sort_order', { ascending: true }),
        supabase.from('exam_slots').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      const allSubjects = subjectsRes.data || [];
      const allModules = modulesRes.data || [];
      const userPreferences = prefRes.data || { enabled: false, reminder_time: '09:00', quiet_hours_start: '22:00', quiet_hours_end: '08:00', tone: 'motivating' };
      const allTopics = topicsRes.data || [];
      const allTasks = tasksRes.data || [];
      const subjectTemplates = subjectTemplatesRes.data || [];
      const allExamSlots = examSlotsRes.data || [];
      const allPlans = plansRes.data || [];

      // Scope to active plan if one is set
      const subjects = resolvedPlanId
        ? allSubjects.filter(s => s.plan_id === resolvedPlanId || !s.plan_id)
        : allSubjects;

      const modules = resolvedPlanId
        ? allModules.filter(m => m.plan_id === resolvedPlanId || !m.plan_id)
        : allModules;

      const topics = resolvedPlanId
        ? allTopics.filter(t => t.plan_id === resolvedPlanId || !t.plan_id)
        : allTopics;

      const tasks = resolvedPlanId
        ? allTasks.filter(t => t.plan_id === resolvedPlanId || !t.plan_id)
        : allTasks;

      const activePlan = allPlans.find(p => p.id === resolvedPlanId) || allPlans[0] || null;

      // Dashboard derived data
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(t => t.date === todayStr);
      const overdueTasks = tasks.filter(t => t.date < todayStr && t.status === 'pending');
      const upcomingTasks = tasks.filter(t => t.date > todayStr && t.status === 'pending');

      // Next exam
      const subjectsWithExams = subjects
        .filter(s => s.exam_date)
        .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
      const nextExam = subjectsWithExams[0] ? {
        id: subjectsWithExams[0].id,
        name: subjectsWithExams[0].name,
        date: subjectsWithExams[0].exam_date,
        daysLeft: Math.ceil((new Date(subjectsWithExams[0].exam_date) - new Date()) / (1000 * 60 * 60 * 24))
      } : null;

      // Weekly activity (last 7 days)
      const weekActivity = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const completed = tasks.filter(t => t.date === dateStr && t.status === 'completed').length;
        return { date: dateStr, completed, day: d.toLocaleDateString('en-US', { weekday: 'short' }) };
      });

      // Sync streak to backend async if the streak has changed (fire and forget)
      // This ensures the public leaderboard always has the up-to-date streak
      const streak = calculateStreak(tasks);
      const activeCompleted = tasks.filter(t => t.status === 'completed').length;
      
      const syncProfileLeaderboardState = async () => {
        if (!profile) return;
        
        // Auto-provision display name and opt-in if missing
        const isNewUser = !profile.display_name;
        const needsUpdate = isNewUser || profile.current_streak !== streak || profile.completed_tasks !== activeCompleted;
        
        if (needsUpdate) {
           const patch = {
             current_streak: streak,
             best_streak: Math.max(streak, profile.best_streak || 0),
             completed_tasks: activeCompleted
           };
           
           if (isNewUser) {
             patch.display_name = generateRandomName();
             patch.show_on_leaderboard = true;
           }
           
           supabase.from('profiles').update(patch).eq('id', userId).then()
        }
      };
      syncProfileLeaderboardState();

      return {
        profile,
        userPreferences,
        activePlan,
        subjects,
        modules,
        topics,
        tasks,
        allPlans,
        subjectTemplates,
        examSlots: resolvedPlanId ? allExamSlots.filter(e => e.plan_id === resolvedPlanId) : allExamSlots,
        raw: { allSubjects, allPlans },
        dashboard: {
          todaysTasks,
          overdueTasks,
          upcomingTasks,
          nextExam,
          streak: calculateStreak(tasks),
          weekActivity,
        },
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

// ─── Mutation hook ────────────────────────────────────────────────────────────
export function useDataMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const activePlanId = useAppStore.getState().activePlanId;
      const { action } = payload;

      // ── Plan management ──
      if (action === 'importS4') {
        const { data: planId, error } = await supabase.rpc('apply_s4_seed', { target_user_id: userId });
        if (error) throw error;
        
        // Set active plan in store
        if (planId) useAppStore.getState().setActivePlanId(planId);

        // Optionally seed the master schedule
        if (payload.seedSchedule) {
          try {
            await internalSeedSchedule(planId);
          } catch (seedErr) {
            console.warn('S4 Master Schedule seeding partially failed:', seedErr.message);
            // We dont throw here as per requirements: "do not fail the whole import"
            return { planId, warning: 'Plan imported, but master schedule seeding encountered an issue: ' + seedErr.message };
          }
        }

        return { planId };
      }

      else if (action === 'startBlank') {
        const { data, error } = await supabase.rpc('complete_custom_onboarding', { target_user_id: userId });
        if (error) throw error;
        if (data) useAppStore.getState().setActivePlanId(data);
        return { planId: data };
      }

      else if (action === 'attachSubjectToSlot') {
        const { data, error } = await supabase.rpc('attach_subject_to_slot', {
          p_user_id: userId,
          p_plan_id: payload.planId || activePlanId,
          p_slot_id: payload.slotId || '00000000-0000-0000-0000-000000000000',
          p_subject_template_id: payload.subjectTemplateId,
        });
        if (error) throw error;
        return { subjectId: data };
      }

      else if (action === 'setActivePlan') {
        useAppStore.getState().setActivePlanId(payload.planId);
        await supabase.from('profiles').update({ active_plan_id: payload.planId }).eq('id', userId);
      }

      // ── Topic management ──
      else if (action === 'updateTopicStatus') {
        const patch = { status: payload.status };
        if (payload.status === 'done') patch.completed_date = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('topics')
          .update(patch)
          .eq('id', payload.topicId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'toggleTopicWeak') {
        const { error } = await supabase.from('topics')
          .update({ is_weak: payload.isWeak })
          .eq('id', payload.topicId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'addTopic') {
        const { error } = await supabase.from('topics').insert({
          ...payload.topic,
          plan_id: payload.planId || activePlanId,
          user_id: userId,
          title: payload.topic.title || payload.topic.name,
        });
        if (error) throw error;
      }

      // ── Subject management ──
      else if (action === 'addSubject') {
        const { data, error } = await supabase.from('subjects').insert({
          ...payload.subject,
          plan_id: payload.planId || activePlanId,
          user_id: userId,
        }).select().single();
        if (error) throw error;
        return data;
      }

      else if (action === 'updateSubject') {
        const { error } = await supabase.from('subjects')
          .update(payload.patch)
          .eq('id', payload.subjectId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      // ── Task management ──
      else if (action === 'addTask') {
        const { error } = await supabase.from('study_plan').insert({
          ...payload.task,
          plan_id: payload.planId || activePlanId,
          user_id: userId,
        });
        if (error) throw error;
      }

      else if (action === 'updateTask') {
        const { error } = await supabase.from('study_plan')
          .update(payload.patch)
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'rescheduleTask') {
        const { error } = await supabase.from('study_plan')
          .update({ date: payload.date, status: 'pending' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'deleteTask') {
        const { error } = await supabase.from('study_plan')
          .delete()
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      // ── Profile / Options Management ──
      else if (action === 'updateProfile') {
        const { error } = await supabase.from('profiles')
          .update(payload.patch)
          .eq('id', userId);
        if (error) throw error;
      }

      else if (action === 'updateNotificationPreferences') {
        const { error } = await supabase.from('notification_preferences')
          .upsert({ ...payload.patch, user_id: userId }, { onConflict: 'user_id' });
        if (error) throw error;
      }

      // ── Plan management ──
      else if (action === 'createPlan') {
        const { data, error } = await supabase.from('plans').insert({
          ...payload.plan,
          user_id: userId,
        }).select().single();
        if (error) throw error;
        return data;
      }

      else if (action === 'updatePlan') {
        const { error } = await supabase.from('plans')
          .update(payload.patch)
          .eq('id', payload.planId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'seedSchedule') {
        const planId = payload.planId || activePlanId;
        if (!planId) throw new Error('No active plan found');
        await internalSeedSchedule(planId);
        return { success: true };
      }

      // Shared helper for seeding (defined inside the mutate scope to access supabase, userId, etc.)
      async function internalSeedSchedule(planId) {
        // 1. Check for existing tasks in the range
        const startDate = '2026-04-17';
        const endDate = '2026-04-24';
        const { data: existingTasks, error: checkErr } = await supabase
          .from('study_plan')
          .select('id')
          .eq('user_id', userId)
          .eq('plan_id', planId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (checkErr) throw checkErr;
        if (existingTasks && existingTasks.length > 0) {
          // Already seeded? Update flag just in case it was out of sync
          await supabase.from('plans').update({ has_master_schedule: true }).eq('id', planId);
          return;
        }

        // 2. Fetch subjects and topics for resolution
        const { data: subjects, error: subErr } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', userId)
          .eq('plan_id', planId);
        if (subErr) throw subErr;

        const { data: topics, error: topErr } = await supabase
          .from('topics')
          .select('*')
          .eq('user_id', userId)
          .eq('plan_id', planId);
        if (topErr) throw topErr;

        // Helper: Resolve subject by name/alias
        const normalize = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const resolveSubject = (label) => {
          const aliases = {
            'maths': ['maths', 'mathematics'],
            'ai': ['ai', 'artificial intelligence'],
            'os': ['os', 'operating systems'],
            'dbms': ['dbms'],
            'economics': ['economics']
          };
          const target = normalize(label);
          const validAliases = aliases[target] || [target];

          return subjects.find(s => {
            const subName = normalize(s.name);
            const subCode = normalize(s.code);
            return validAliases.includes(subName) || validAliases.includes(subCode);
          });
        };

        // Helper: Resolve topic by priority list
        const resolveTopic = (subjectId, label) => {
          const priorityMap = {
            'maths': ['Trees', 'Dijkstra', 'Floyd', 'Prim', 'Kruskal'],
            'ai': ['BFS', 'DFS', 'A*', 'Minimax', 'Logic'],
            'os': ['Scheduling', 'Deadlocks', 'Memory'],
            'dbms': ['SQL', 'ER', 'Normalization'],
            'economics': ['Demand', 'Supply', 'Elasticity', 'Cost', 'Markets']
          };
          const subjectTopics = topics.filter(t => t.subject_id === subjectId);
          const priorities = priorityMap[normalize(label)] || [];

          for (const p of priorities) {
            const match = subjectTopics.find(t => 
              normalize(t.title).includes(normalize(p)) || 
              normalize(t.name).includes(normalize(p))
            );
            if (match) return match.id;
          }
          return null;
        };

        const schedule = [
          { date: '2026-04-17', tasks: [{ sub: 'maths', type: 'Deep Dive' }, { sub: 'ai', type: 'Quick Revision' }] },
          { date: '2026-04-18', tasks: [{ sub: 'ai', type: 'Deep Dive' }, { sub: 'maths', type: 'Quick Revision' }] },
          { date: '2026-04-19', tasks: [{ sub: 'ai', type: 'Deep Dive' }, { sub: 'os', type: 'Quick Revision' }] },
          { date: '2026-04-20', tasks: [{ sub: 'ai', type: 'Deep Dive' }, { sub: 'maths', type: 'Quick Revision' }] },
          { date: '2026-04-21', tasks: [{ sub: 'os', type: 'Deep Dive' }, { sub: 'ai', type: 'Quick Revision' }] },
          { date: '2026-04-22', tasks: [{ sub: 'os', type: 'Deep Dive' }, { sub: 'maths', type: 'Quick Revision' }] },
          { date: '2026-04-23', tasks: [{ sub: 'dbms', type: 'Deep Dive' }, { sub: 'os', type: 'Quick Revision' }] },
          { date: '2026-04-24', tasks: [{ sub: 'economics', type: 'Deep Dive' }, { sub: 'os', type: 'Quick Revision' }] },
        ];

        const todayStr = new Date().toISOString().split('T')[0];
        const validSchedule = schedule.filter(day => day.date >= todayStr);

        const rows = [];
        for (const day of validSchedule) {

          for (const t of day.tasks) {
            const subject = resolveSubject(t.sub);
            if (!subject) throw new Error(`Required subject "${t.sub}" not found.`);

            const topicId = resolveTopic(subject.id, t.sub);
            rows.push({
              id: crypto.randomUUID(),
              user_id: userId,
              plan_id: planId,
              subject_id: subject.id,
              topic_id: topicId,
              date: day.date,
              title: `${subject.name} — ${t.type}`,
              planned_minutes: t.type === 'Deep Dive' ? 180 : 60,
              status: 'pending',
              task_type: t.type === 'Deep Dive' ? 'main' : 'light'
            });
          }
        }

        const { error: insErr } = await supabase.from('study_plan').insert(rows);
        if (insErr) throw insErr;

        // Mark plan as having master schedule
        await supabase.from('plans').update({ 
          has_master_schedule: true,
          master_schedule_seeded_at: new Date().toISOString()
        }).eq('id', planId);
      }



      return { success: true };
    },

    onSuccess: () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          queryClient.invalidateQueries({ queryKey: ['appData', session.user.id] });
        }
      });
    },
  });
}
