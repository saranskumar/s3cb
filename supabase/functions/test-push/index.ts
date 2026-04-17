import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId;

    // Get the JWT from the Authorization header or fallback
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user) {
         userId = user.id;
      } else {
         console.error("JWT Auth Failed:", authError);
      }
    }

    // Fallback: If no valid token found, try to read user_id from body
    if (!userId) {
       try {
         const body = await req.json();
         if (body && body.user_id) {
            userId = body.user_id;
         }
       } catch(e) {
         // ignore body parse error
       }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'No user identified via JWT or payload.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const vaporSubject = "mailto:hello@koaplanner.app";
    const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    
    if (!vaporPublic || !vaporPrivate) {
      throw new Error("VAPID keys are missing from Supabase Secrets.");
    }

    webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (subErr) throw subErr;

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ 
        status: "success", 
        message: "Auth OK, but no active push subscriptions found for this device/user." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const payload = JSON.stringify({
      title: "KōA Powerup! 🚀",
      body: "Test notification successful. Your study alerts are now live.",
      icon: '/icon.ico',
      url: '/',
      actions: [
        { action: 'start', title: '🚀 Start Session' }
      ],
      requireInteraction: true
    });

    let successCount = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload);
        successCount++;
      } catch (err) {
        console.error(`Push failed:`, err);
        if (err.statusCode === 404 || err.statusCode === 410) {
           await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ status: "success", successCount, totalTried: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
