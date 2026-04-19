import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

// ─── Name Helper ────────────────────────────────────────────────────────────
function getNotificationName(displayName: string | null): string | null {
  if (!displayName) return null;
  const firstWord = displayName.trim().split(" ")[0];
  return firstWord ? firstWord.toUpperCase() : null;
}

// ─── Message Pools ───────────────────────────────────────────────────────────
type MessageEntry = { id: string; title: string; body: string };

const MORNING_POOL: MessageEntry[] = [
  { id: "morning_1", title: "A fresh start", body: "{name}, your day's ready. Start whenever you want." },
  { id: "morning_2", title: "Rise and begin", body: "Good morning {name} — begin with one small step." },
  { id: "morning_3", title: "Just start", body: "{name}, just start — that's enough." },
  { id: "morning_4", title: "First session", body: "A fresh day, {name}. Begin your first session." },
  { id: "morning_5", title: "Make it count", body: "{name}, today is another chance. Open your plan." },
  { id: "morning_6", title: "Morning check-in", body: "Morning, {name}. One task at a time." },
];

const GENERAL_POOL: MessageEntry[] = [
  { id: "general_1", title: "Keep moving", body: "{name}, keep things moving — one task is enough." },
  { id: "general_2", title: "Quick session", body: "A quick session now helps a lot later." },
  { id: "general_3", title: "Stay on track", body: "{name}, don't lose momentum today." },
  { id: "general_4", title: "Halfway there", body: "{name}, mid-day check — how's your progress?" },
  { id: "general_5", title: "One more block", body: "One focused block now, {name}. That's all it takes." },
];

const EVENING_POOL: MessageEntry[] = [
  { id: "evening_1", title: "Finish strong", body: "{name}, finish today strong." },
  { id: "evening_2", title: "Still time left", body: "Still time left — one more session, {name}." },
  { id: "evening_3", title: "End well", body: "{name}, end the day on a good note." },
  { id: "evening_4", title: "Evening check-in", body: "How did today go, {name}? Wrap it up right." },
  { id: "evening_5", title: "Last push", body: "{name}, close out strong before you rest." },
];

// Smart message templates (30% injection chance)
function buildSmartMessages(
  name: string | null,
  pendingCount: number,
  streak: number,
  subject: string | null
): MessageEntry[] {
  const pool: MessageEntry[] = [];
  const n = name ?? "Hey";

  if (pendingCount > 0) {
    pool.push({ id: "smart_pending_1", title: "Tasks waiting", body: `${n}, you've got ${pendingCount} thing${pendingCount > 1 ? "s" : ""} left today.` });
    pool.push({ id: "smart_pending_2", title: "Keep going", body: `${pendingCount} task${pendingCount > 1 ? "s" : ""} to go. You can do this, ${n}.` });
  }
  if (streak > 1) {
    pool.push({ id: "smart_streak_1", title: "Protect your streak", body: `${n}, don't break your ${streak}-day streak today.` });
    pool.push({ id: "smart_streak_2", title: `${streak}-day run`, body: `${streak} days strong, ${n}. Keep it alive.` });
  }
  if (subject) {
    pool.push({ id: "smart_subject_1", title: "Subject focus", body: `${subject} needs your attention today, ${n}.` });
  }
  if (pendingCount === 0) {
    pool.push({ id: "smart_clear_1", title: "Clean slate", body: `${n}, you're ahead today. Stay consistent.` });
    pool.push({ id: "smart_clear_2", title: "Well done", body: `All clear for now, ${n}. Great discipline.` });
  }
  return pool;
}

// ─── Message Selection ───────────────────────────────────────────────────────
function renderMessage(template: string, name: string | null, streak: number, subject: string | null): string {
  const n = name ?? "Hey";
  return template
    .replace("{name}", n)
    .replace("{streak}", String(streak))
    .replace("{subject}", subject ?? "your next subject");
}

function pickMessage(
  localHour: number,
  name: string | null,
  pendingCount: number,
  streak: number,
  subject: string | null,
  lastMessageIds: string[]
): { id: string; title: string; body: string } {
  // Time category
  let basePool: MessageEntry[];
  if (localHour < 12) basePool = MORNING_POOL;
  else if (localHour < 18) basePool = GENERAL_POOL;
  else basePool = EVENING_POOL;

  // Filter out recently used message IDs
  const recentSet = new Set(lastMessageIds.slice(-3));
  const filtered = basePool.filter((m) => !recentSet.has(m.id));
  const pool = filtered.length > 0 ? filtered : basePool;

  // 30% chance: inject a smart message
  if (Math.random() < 0.30) {
    const smartPool = buildSmartMessages(name, pendingCount, streak, subject).filter(
      (m) => !recentSet.has(m.id)
    );
    if (smartPool.length > 0) {
      const picked = smartPool[Math.floor(Math.random() * smartPool.length)];
      return {
        id: picked.id,
        title: picked.title,
        body: renderMessage(picked.body, name, streak, subject),
      };
    }
  }

  // Pick from base pool
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: picked.id,
    title: picked.title,
    body: renderMessage(picked.body, name, streak, subject),
  };
}

// ─── Main Handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const vaporSubject = "mailto:hello@koa-study.app";
  const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
  const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

  if (!vaporPublic || !vaporPrivate) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500 });
  }

  webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

  try {
    // Security check
    const cronSecret = Deno.env.get("CRON_SECRET");
    const reqSecret = req.headers.get("x-cron-secret");
    if (cronSecret && reqSecret !== cronSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Fetch all enabled notification preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select("user_id, enabled, reminder_times, active_plan_id, tz_offset, last_messages")
      .eq("enabled", true);

    if (prefsErr) throw prefsErr;

    const now = new Date();
    const results = [];

    for (const pref of prefs ?? []) {
      if (!pref.user_id) continue;
      if (pref.tz_offset === null || pref.tz_offset === undefined) continue;

      // Calculate user's local time
      const userLocalTime = new Date(now.getTime() - pref.tz_offset * 60000);
      const hours = userLocalTime.getUTCHours();
      const minutes = userLocalTime.getUTCMinutes();
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      // Check if current time matches any reminder_times — always send if matched
      const reminderTimes: string[] = pref.reminder_times ?? ["09:00", "20:00"];
      const shouldSend = reminderTimes.some((t: string) => t === timeStr);
      if (!shouldSend) continue;

      // Fetch profile for name + streak
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, current_streak")
        .eq("id", pref.user_id)
        .single();

      // Fetch optional context data (minimal)
      const todayStr = userLocalTime.toISOString().split("T")[0];
      const { data: activeTasks } = await supabase
        .from("study_plan")
        .select("status, subject_id")
        .eq("user_id", pref.user_id)
        .eq("plan_id", pref.active_plan_id)
        .eq("date", todayStr);

      const pendingCount = activeTasks?.filter((t: { status: string }) => t.status === "pending").length ?? 0;
      const streak = profile?.current_streak ?? 0;

      // Get next pending subject name (optional)
      let subjectName: string | null = null;
      if (pendingCount > 0 && activeTasks) {
        const pendingTask = activeTasks.find((t: { status: string }) => t.status === "pending");
        if (pendingTask?.subject_id) {
          const { data: sub } = await supabase
            .from("subjects")
            .select("name")
            .eq("id", pendingTask.subject_id)
            .single();
          subjectName = sub?.name ?? null;
        }
      }

      // Resolve name
      const notifName = getNotificationName(profile?.display_name ?? null);

      // Pick message (with anti-repetition)
      const lastMessageIds: string[] = pref.last_messages ?? [];
      const { id: messageId, title, body } = pickMessage(hours, notifName, pendingCount, streak, subjectName, lastMessageIds);

      // Update last_messages (keep last 3)
      const updatedLastMessages = [...lastMessageIds, messageId].slice(-3);
      await supabase
        .from("notification_preferences")
        .update({ last_messages: updatedLastMessages })
        .eq("user_id", pref.user_id);

      // Compose payload
      const payload = JSON.stringify({
        title,
        body,
        icon: "/icon-512.png",
        url: "/",
        actions: [{ action: "start", title: "🚀 Start Session" }],
        requireInteraction: true,
      });

      // Send to all push subscriptions for this user
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", pref.user_id);

      if (!subs) continue;

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          results.push({ userId: pref.user_id, status: "success", messageId });
        } catch (err: any) {
          // Auto-cleanup expired subscriptions
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", processed: results.length, sent: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
