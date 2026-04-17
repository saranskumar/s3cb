import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuthView() {
  const [isLoading, setIsLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      alert(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-[#fdfdf9] selection:bg-[#bfd8bd]/40">
      
      {/* Subtle background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#bfd8bd]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#dde7c7]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* PWA Install Banner */}
        {showInstall && (
          <div className="bg-white border border-[#dde7c7] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-[#bfd8bd]/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} className="text-[#3c7f65]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#313c1a] text-sm">Install App</p>
              <p className="text-xs text-[#627833] font-medium">Access offline, faster</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="h-8 px-3 bg-[#77bfa3] hover:bg-[#50a987] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <Download size={12} /> Install
              </button>
              <button
                onClick={() => setShowInstall(false)}
                className="h-8 w-8 flex items-center justify-center text-[#98c9a3] hover:text-[#627833] rounded-lg transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#dde7c7] p-8 shadow-[0_4px_32px_rgba(49,60,26,0.06)]">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-[#77bfa3] flex items-center justify-center shadow-[0_4px_12px_rgba(119,191,163,0.4)]">
              <BookOpen size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#313c1a] tracking-tight leading-none">S4 Planner</h1>
              <p className="text-xs text-[#98c9a3] font-bold mt-0.5 uppercase tracking-widest">Study Tool</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#313c1a] tracking-tight leading-snug">
              Your semester, <br />organised.
            </h2>
            <p className="text-[#627833] text-sm font-medium mt-2 leading-relaxed">
              Track your S4 subjects, plan daily tasks, and never miss an exam deadline.
            </p>
          </div>

          {/* Sign-in button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border-2 border-[#dde7c7] hover:border-[#98c9a3] hover:bg-[#f8faf4] text-[#313c1a] font-bold text-sm rounded-2xl transition-all disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#3c7f65]/40 border-t-[#3c7f65] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-[11px] text-[#b8cd8a] font-medium text-center mt-5 leading-relaxed">
            Your progress syncs across devices.<br />
            Data is private and secure.
          </p>
        </div>
      </div>
    </div>
  );
}
