import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

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

      // Parallel fetch: user data
      const [subjectsRes, modulesRes, topicsRes, tasksRes, plansRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('modules').select('*').eq('user_id', userId).order('module_no', { ascending: true }),
        supabase.from('topics').select('*').eq('user_id', userId).order('sort_order', { ascending: true }),
        supabase.from('study_plan').select('*').eq('user_id', userId),
        supabase.from('plans').select('*').eq('user_id', userId),
      ]);

      const allSubjects = subjectsRes.data || [];
      const allModules = modulesRes.data || [];
      const allTopics = topicsRes.data || [];
      const allTasks = tasksRes.data || [];
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

      return {
        profile,
        activePlan,
        subjects,
        modules,
        topics,
        tasks,
        allPlans,
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
        const { data, error } = await supabase.rpc('apply_s4_seed', { target_user_id: userId });
        if (error) throw error;
        // Set active plan in store
        if (data) useAppStore.getState().setActivePlanId(data);
        return { planId: data };
      }

      else if (action === 'startBlank') {
        const { data, error } = await supabase.rpc('complete_custom_onboarding', { target_user_id: userId });
        if (error) throw error;
        if (data) useAppStore.getState().setActivePlanId(data);
        return { planId: data };
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
