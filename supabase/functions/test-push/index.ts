import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.1";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // 1. Handle Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Get User from JWT (Security Best Practice)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid user token');
    }

    const userId = user.id;

    // 4. Setup Web Push VAPID keys
    const vaporSubject = "mailto:hello@koaplanner.app";
    const vaporPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vaporPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    
    if (!vaporPublic || !vaporPrivate) {
      throw new Error("VAPID keys not configured on server");
    }

    webpush.setVapidDetails(vaporSubject, vaporPublic, vaporPrivate);

    // 5. Retrieve Subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ status: "success", message: "No active push subscriptions found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const payload = JSON.stringify({ 
      title: "KōA Powerup! 🚀", 
      body: "Test notification successful. Your study alerts are now live.", 
      icon: '/icon.png', 
      badge: '/icon.png',
      data: { url: '/' }
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
        console.error(`Push failed for ${sub.endpoint}:`, err);
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
    console.error('Edge Function Error:', error.message);
    return new Response(JSON.stringify({ status: "error", error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
