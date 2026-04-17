import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Use the env variable or a placeholder if missing
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications(session) {
  const [permission, setPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionState();
  }, [session]);

  const checkSubscriptionState = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      console.error('Error checking subscription state');
    }
  };

  const subscribeToPush = async () => {
    setIsLoading(true);
    try {
      if (!publicVapidKey) {
        throw new Error("VITE_VAPID_PUBLIC_KEY is missing from .env.local");
      }
      
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Attempt to subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const subData = subscription.toJSON();

      // Save to Supabase
      if (session?.user?.id) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: session.user.id,
            endpoint: subData.endpoint,
            p256dh: subData.keys.p256dh,
            auth: subData.keys.auth,
            user_agent: navigator.userAgent
          }, { onConflict: 'user_id,endpoint' });

        if (error) throw error;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Failed to subscribe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from DB
        if (session?.user?.id) {
           await supabase
            .from('push_subscriptions')
            .delete()
            .match({ 
              user_id: session.user.id, 
              endpoint: subscription.endpoint 
            });
        }
      }
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!session?.user?.id) return { success: false, error: 'Not logged in' };
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-push');
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Test notification failed:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  };
}
