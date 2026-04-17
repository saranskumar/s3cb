import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

serve(async (req) => {
  // 1. Initialize Supabase Client
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 2. Setup Web Push VAPID keys
  const vaporSubject = "mailto:hello@s4tracker.app";
  const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  
  if (!vaporPublic || !vaporPrivate) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500 });
  }

  webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

  try {
    // 3. Get all active preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from('notification_preferences')
      .select('user_id, enabled, tone, active_plan_id, reminder_times, nudge_8pm_enabled, tz_offset')
      .eq('enabled', true);

    if (prefsErr) throw prefsErr;

    const results = [];
    const now = new Date();

    // 4. For each active user, check if now is a trigger time for them
    for (const pref of prefs) {
      if (!pref.user_id) continue;

      // Calculate user's local time
      // tz_offset is in minutes (e.g. -330 for IST is stored as -330)
      // JS getTimezoneOffset() returns -330 for IST. 
      // So LocalTime = UTC - OffsetInMinutes
      const userLocalTime = new Date(now.getTime() - (pref.tz_offset * 60000));
      const hours = userLocalTime.getUTCHours();
      const minutes = userLocalTime.getUTCMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // We check a 15-minute window to be safe if cron isn't exactly on the dot
      const isMorningReminder = (pref.reminder_times || []).some(t => {
        const [h, m] = t.split(':').map(Number);
        // Match if within the same hour and same 15m block (assuming 15m cron)
        return h === hours && Math.abs(m - minutes) < 15;
      });

      // 8 PM Nudge check
      const is8PMNudge = pref.nudge_8pm_enabled && hours === 20 && minutes < 15;

      if (!isMorningReminder && !is8PMNudge) continue;

      // 5. Gather personalized motivation data
      const todayStr = userLocalTime.toISOString().split('T')[0];
      const { data: activeTasks } = await supabase
        .from('study_plan')
        .select('status')
        .eq('user_id', pref.user_id)
        .eq('plan_id', pref.active_plan_id)
        .eq('date', todayStr);

      const pendingCount = activeTasks?.filter(t => t.status === 'pending').length || 0;
      
      // Filter: 8 PM nudge ONLY triggers if pendingCount > 0
      if (is8PMNudge && pendingCount === 0) continue;

      // Compose message
      let title = "S4 Study Reminder";
      let body = "Time to push forward!";

      if (is8PMNudge) {
        title = "Closing the day?";
        body = `You have ${pendingCount} tasks left for today. Finish them now to keep your streak alive! 🔥`;
      } else {
        if (pendingCount > 0) {
          title = pref.tone === 'strict' ? "Get to Work." : "Ready to study?";
          body = `You have ${pendingCount} tasks for today. Start small, finish big.`;
        } else {
          title = "Clean Slate!";
          body = "No tasks pending for today. Use the extra time to get ahead!";
        }
      }

      // 6. Send Notifications
      const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', pref.user_id);
      if (!subs) continue;

      const payload = JSON.stringify({ title, body, icon: 'icon.ico', url: '/' });

      for (const sub of subs) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload);
          results.push({ userId: pref.user_id, status: 'success', type: is8PMNudge ? 'nudge' : 'reminder' });
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
             await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", processed: results.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
