import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { generateRandomName } from '../lib/names';
import { generateId } from '../lib/utils';

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
export function useAppData(session) {
  const userId = session?.user?.id;
  const activePlanId = useAppStore(state => state.activePlanId);

  return useQuery({
    queryKey: ['appData', userId, activePlanId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch profile first to get active_plan_id (using maybeSingle to avoid 406 error)
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let activeProfile = profile;

      // Auto-repair missing profile to prevent 406/404 stuck states if trigger fails
      if (!activeProfile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({ id: userId, is_onboarded: false }, { onConflict: 'id' })
          .select()
          .single();
        activeProfile = newProfile;
      }

      if (!activeProfile) return null;

      const resolvedPlanId = activePlanId || activeProfile.active_plan_id;

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
      const userPreferences = prefRes.data || { 
        enabled: true, 
        reminder_times: ["09:00", "20:00"],
        tz_offset: new Date().getTimezoneOffset(),
        last_messages: []
      };
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

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Auto-repair/normalize "moved_tomorrow" status if it's now today or past
      const normalizedTasks = allTasks.map(t => {
        if (t.status === 'moved_tomorrow' && t.date <= todayStr) {
          return { ...t, status: 'pending' };
        }
        return t;
      });

      const tasks = resolvedPlanId
        ? normalizedTasks.filter(t => t.plan_id === resolvedPlanId || !t.plan_id)
        : normalizedTasks;

      const activePlan = allPlans.find(p => p.id === resolvedPlanId) || allPlans[0] || null;

      const todaysTasks = tasks.filter(t => 
        t.date === todayStr || 
        (t.date === tomorrowStr && t.status === 'moved_tomorrow')
      );
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
        // Auto-provision display name and opt-in if missing
        const isNewUser = !activeProfile.display_name;
        const isMissingPublicName = !activeProfile.public_name;
        const needsOptIn = activeProfile.show_on_leaderboard !== true;
        const needsUpdate = isNewUser || isMissingPublicName || needsOptIn || activeProfile.current_streak !== streak || activeProfile.completed_tasks !== activeCompleted;
        
        if (needsUpdate) {
           const patch = {
             current_streak: streak,
             best_streak: Math.max(streak, activeProfile.best_streak || 0),
             completed_tasks: activeCompleted,
             show_on_leaderboard: true, // Always enforce opt-in
           };
           
           if (isNewUser) {
             // Priority: Google Real Name -> Random Identity
             const googleName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name;
             patch.display_name = googleName || generateRandomName();
           }

           if (isMissingPublicName) {
             patch.public_name = generateRandomName();
           }
           
           supabase.from('profiles').update(patch).eq('id', userId).then()
        }
      };
      syncProfileLeaderboardState();

      // Auto-schedule full revision tasks between exams
      const autoSeedRevisions = async () => {
        if (!activePlan || subjects.length === 0) return;
        
        const examSubjects = subjects
          .filter(s => s.exam_date)
          .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
          
        if (examSubjects.length === 0) return;

        const newTasks = [];
        const todayStr = new Date().toISOString().split('T')[0];

        examSubjects.forEach((subject, idx) => {
          let startDate;
          if (idx === 0) {
            // For the first exam, start 2 days before
            const firstExamDate = new Date(subject.exam_date);
            firstExamDate.setDate(firstExamDate.getDate() - 2);
            startDate = firstExamDate;
          } else {
            // For subsequent exams, start on the day of the previous exam
            startDate = new Date(examSubjects[idx - 1].exam_date);
          }

          const endDate = new Date(subject.exam_date);
          const current = new Date(startDate);

          // Iterate through days up to (but not including) the exam day
          while (current < endDate) {
            const dateStr = current.toISOString().split('T')[0];
            const title = `Full Revision: ${subject.name}`;
            
            // Limit seeding to dates from today onwards + prevent duplicates
            if (dateStr >= todayStr) {
               const exists = tasks.some(t => t.subject_id === subject.id && t.date === dateStr && t.title === title);
               if (!exists) {
                 newTasks.push({
                   id: generateId(),
                   user_id: userId,
                   plan_id: activePlan.id,
                   subject_id: subject.id,
                   date: dateStr,
                   title: title,
                   planned_minutes: 120,
                   status: 'pending',
                   task_type: 'main'
                 });
               }
            }
            current.setDate(current.getDate() + 1);
          }
        });

        if (newTasks.length > 0) {
          supabase.from('study_plan').insert(newTasks).then();
        }
      };
      autoSeedRevisions();

      return {
        profile: activeProfile,
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
export function useDataMutation(userId) {
  const queryClient = useQueryClient();
  const activePlanId = useAppStore(state => state.activePlanId);

  return useMutation({
    mutationFn: async (payload) => {
      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id;
      }
      if (!userId) throw new Error('Not authenticated');

      const { action } = payload;

      // ── Plan management ──
      if (action === 'importS4') {
        const { data: planId, error } = await supabase.rpc('apply_s4_seed', { target_user_id: userId });
        if (error) throw error;
        
        // Set active plan in store
        if (planId) useAppStore.getState().setActivePlanId(planId);


        return { planId };
      }

      else if (action === 'startBlank') {
        const { data, error } = await supabase.rpc('complete_custom_onboarding', { target_user_id: userId });
        if (error) throw error;
        if (data) useAppStore.getState().setActivePlanId(data);
        return { planId: data };
      }

      else if (action === 'importAIPlan') {
        const { plan, subjects: aiSubjects, study_plan: aiTasks } = payload.payload;
        
        // 1. Insert Plan
        const { data: planData, error: planErr } = await supabase.from('plans').insert({
          user_id: userId,
          title: plan.title,
          description: plan.description || '',
          is_s4: false,
          has_master_schedule: true
        }).select().single();
        if (planErr) throw planErr;
        
        const planId = planData.id;

        // 2. Prepare batched rows
        const subjectRows = [];
        const moduleRows = [];
        const topicRows = [];
        
        const subjectNameIdMap = {};
        const topicMatchMap = {};

        if (Array.isArray(aiSubjects)) {
          aiSubjects.forEach((sub, subIdx) => {
            const subId = generateId();
            subjectNameIdMap[sub.name] = subId;
            
            subjectRows.push({
              id: subId,
              user_id: userId,
              plan_id: planId,
              name: sub.name,
              exam_date: sub.exam_date || null,
              sort_order: subIdx + 1,
              template_subject_id: null
            });

            if (Array.isArray(sub.modules)) {
               sub.modules.forEach((mod, modIdx) => {
                 const modId = generateId();
                 moduleRows.push({
                   id: modId,
                   user_id: userId,
                   plan_id: planId,
                   subject_id: subId,
                   title: mod.name,
                   module_no: modIdx + 1,
                   template_module_id: null
                 });

                 if (Array.isArray(mod.topics)) {
                   mod.topics.forEach((topName, topIdx) => {
                     const topId = generateId();
                     topicMatchMap[`${sub.name}|${topName}`] = topId;
                     topicRows.push({
                       id: topId,
                       user_id: userId,
                       plan_id: planId,
                       subject_id: subId,
                       module_id: modId,
                       name: topName,
                       title: topName,
                       sort_order: topIdx + 1,
                       template_topic_id: null
                     });
                   });
                 }
               });
            }
          });
        }

        // 3. Batch insert subjects, modules, topics (no RPC needed for straightforward inserts)
        if (subjectRows.length > 0) {
          const { error: subErr } = await supabase.from('subjects').insert(subjectRows);
          if (subErr) throw subErr;
        }
        if (moduleRows.length > 0) {
          const { error: modErr } = await supabase.from('modules').insert(moduleRows);
          if (modErr) throw modErr;
        }
        if (topicRows.length > 0) {
          const { error: topErr } = await supabase.from('topics').insert(topicRows);
          if (topErr) throw topErr;
        }

        // 4. Prepare and Batch tasks
        if (Array.isArray(aiTasks)) {
          const taskRows = aiTasks.map(task => {
            const sId = subjectNameIdMap[task.subject];
            const tId = topicMatchMap[`${task.subject}|${task.topic}`] || null;
            
            return {
              id: generateId(),
              user_id: userId,
              plan_id: planId,
              subject_id: sId,
              topic_id: tId,
              date: task.date,
              title: task.title,
              planned_minutes: task.planned_minutes || 60,
              status: 'pending',
              task_type: task.priority === 'high' ? 'main' : 'light'
            };
          });

          if (taskRows.length > 0) {
            const { error: insErr } = await supabase.from('study_plan').insert(taskRows);
            if (insErr) throw insErr;
          }
        }

        // 5. Update Profile
        await supabase.from('profiles')
          .update({ is_onboarded: true, active_plan_id: planId })
          .eq('id', userId);
        
        useAppStore.getState().setActivePlanId(planId);
        
        return { planId };
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

      else if (action === 'importAITasks') {
        const { planId, tasks, subjects, modules, topics } = payload.payload;

        // Build lookup maps: name → id
        const subjectMap = {};
        subjects.forEach(s => { subjectMap[s.name] = s.id; });

        const moduleMap = {};
        modules.forEach(m => { moduleMap[`${m.subject_id}|${m.title}`] = m.id; });

        const topicMap = {};
        topics.forEach(t => { topicMap[`${t.subject_id}|${(t.title || t.name)}`] = t.id; });

        const taskRows = tasks.map(task => {
          const subjectId = subjectMap[task.subject] || null;
          const moduleId = subjectId ? (moduleMap[`${subjectId}|${task.module}`] || null) : null;
          const topicId = subjectId ? (topicMap[`${subjectId}|${task.topic}`] || null) : null;

          return {
            id: generateId(),
            user_id: userId,
            plan_id: planId,
            subject_id: subjectId,
            module_id: moduleId,
            topic_id: topicId,
            date: task.date,
            title: task.title,
            planned_minutes: task.planned_minutes || 60,
            status: 'pending',
            task_type: task.priority === 'high' ? 'main' : 'light'
          };
        }).filter(t => t.subject_id); // drop any that couldn't be mapped

        if (taskRows.length > 0) {
          const { error } = await supabase.from('study_plan').insert(taskRows);
          if (error) throw error;
        }

        return { count: taskRows.length };
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

      else if (action === 'deleteSubject') {
        const { error } = await supabase.from('subjects')
          .delete()
          .eq('id', payload.subjectId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'updateProfile') {
        const { error } = await supabase.from('profiles')
          .update(payload.patch)
          .eq('id', userId);
        if (error) throw error;
      }

      // ── Task management ──
      else if (action === 'addTask') {
        let rows = [];
        if (Array.isArray(payload.task)) {
          rows = payload.task.map(t => ({
            ...t,
            plan_id: payload.planId || activePlanId,
            user_id: userId,
          }));
        } else {
          rows = [{
            ...payload.task,
            plan_id: payload.planId || activePlanId,
            user_id: userId,
          }];
        }
        const { error } = await supabase.from('study_plan').insert(rows);
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

      else if (action === 'complete') {
        const { error: taskErr } = await supabase.from('study_plan')
          .update({ status: 'completed' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (taskErr) throw taskErr;

        if (payload.topicId) {
          const { error: topErr } = await supabase.from('topics')
            .update({ 
              status: 'done', 
              completed_date: new Date().toISOString().split('T')[0] 
            })
            .eq('id', payload.topicId)
            .eq('user_id', userId);
          if (topErr) throw topErr;
        }
      }

      else if (action === 'uncomplete') {
        const { error: taskErr } = await supabase.from('study_plan')
          .update({ status: 'pending' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (taskErr) throw taskErr;

        if (payload.topicId) {
          const { error: topErr } = await supabase.from('topics')
            .update({ 
              status: 'todo', 
              completed_date: null 
            })
            .eq('id', payload.topicId)
            .eq('user_id', userId);
          if (topErr) throw topErr;
        }
      }

      else if (action === 'skip') {
        const { error } = await supabase.from('study_plan')
          .update({ status: 'skipped' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'unskip') {
        const { error } = await supabase.from('study_plan')
          .update({ status: 'pending' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'move-tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const { error } = await supabase.from('study_plan')
          .update({ date: dateStr, status: 'moved_tomorrow' })
          .eq('id', payload.taskId)
          .eq('user_id', userId);
        if (error) throw error;
      }

      else if (action === 'undo-move') {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('study_plan')
          .update({ date: today, status: 'pending' })
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
          .upsert({ 
            ...payload.patch, 
            user_id: userId,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
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




      return { success: true };
    },

    onMutate: async (payload) => {
      const appDataKey = ['appData', userId, activePlanId];
      
      await queryClient.cancelQueries({ queryKey: appDataKey });
      const previousData = queryClient.getQueryData(appDataKey);

      if (previousData) {
        queryClient.setQueryData(appDataKey, old => {
          // Deepish clone to ensure React reactivity
          const newData = { 
            ...old,
            tasks: old.tasks ? [...old.tasks] : [],
            topics: old.topics ? [...old.topics] : [],
            dashboard: old.dashboard ? { ...old.dashboard } : null
          };
          
          const { action, taskId, topicId, status: newStatus, isWeak } = payload;
          const todayStr = new Date().toISOString().split('T')[0];
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];

          // 1. Update task rows
          if (taskId && newData.tasks) {
            newData.tasks = newData.tasks.map(t => {
              if (t.id === taskId) {
                if (action === 'complete') return { ...t, status: 'completed' };
                if (action === 'uncomplete') return { ...t, status: 'pending' };
                if (action === 'skip') return { ...t, status: 'skipped' };
                if (action === 'unskip') return { ...t, status: 'pending' };
                if (action === 'move-tomorrow') return { ...t, status: 'moved_tomorrow', date: tomorrowStr };
                if (action === 'undo-move') return { ...t, status: 'pending', date: todayStr };
              }
              return t;
            });
          }

          // 2. Update topic rows
          if (topicId && newData.topics) {
            newData.topics = newData.topics.map(t => {
              if (t.id === topicId) {
                if (action === 'complete') return { ...t, status: 'done', completed_date: todayStr };
                if (action === 'uncomplete') return { ...t, status: 'todo', completed_date: null };
                if (action === 'updateTopicStatus') return { ...t, status: newStatus };
                if (action === 'toggleTopicWeak') return { ...t, is_weak: isWeak };
              }
              return t;
            });
          }

          // 3. Update dashboard views and stats
          if (newData.dashboard && newData.tasks) {
             newData.dashboard.todaysTasks = newData.tasks.filter(t => 
               t.date === todayStr || (t.date === tomorrowStr && t.status === 'moved_tomorrow')
             );
             newData.dashboard.overdueTasks = newData.tasks.filter(t => t.date < todayStr && t.status === 'pending');
             newData.dashboard.upcomingTasks = newData.tasks.filter(t => t.date > todayStr && t.status === 'pending');
             
             // Update counters for progress bar
             newData.dashboard.completedCount = newData.tasks.filter(t => t.status === 'completed').length;
             newData.dashboard.totalCount = newData.tasks.length;
             
             // Optimistic streak (simplified check)
             newData.dashboard.streak = calculateStreak(newData.tasks);
          }

          return newData;
        });
      }

      return { previousData, appDataKey };
    },
    onError: (err, payload, context) => {
      if (context?.appDataKey) {
        queryClient.setQueryData(context.appDataKey, context.previousData);
      }
    },
    onSettled: (data, err, payload, context) => {
      if (context?.appDataKey) {
        queryClient.invalidateQueries({ queryKey: context.appDataKey });
      }
    },
  });
}
