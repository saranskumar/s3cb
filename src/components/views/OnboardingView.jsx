import React, { useState } from 'react';
import { Target, Loader2, ArrowRight, BookOpen, Flame } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataMutation } from '../../hooks/useData';

export default function OnboardingView({ onComplete }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const isPastMasterSchedule = todayStr > '2026-04-24';
  const [choice, setChoice] = useState(isPastMasterSchedule ? 's4' : 's4_master');
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useDataMutation();

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      if (choice === 's4_master') {
        const res = await mutation.mutateAsync({ action: 'importS4', seedSchedule: true });
        if (res?.warning) console.warn(res.warning);
        queryClient.invalidateQueries({ queryKey: ['appData'] });
        onComplete('planSetup');
      } else if (choice === 's4') {
        await mutation.mutateAsync({ action: 'importS4', seedSchedule: false });
        queryClient.invalidateQueries({ queryKey: ['appData'] });
        onComplete('planSetup');
      } else {
        await mutation.mutateAsync({ action: 'startBlank' });
        queryClient.invalidateQueries({ queryKey: ['appData'] });
        onComplete('subjects');
      }
    } catch (err) {
      alert('Error setting up workspace: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fdfdf9]">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#bfd8bd]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#dde7c7]/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <header className="mb-10 text-center relative z-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden shadow-[0_10px_24px_rgba(119,191,163,0.35)] mx-auto">
            <img src="/icon.ico" alt="S4" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-[#313c1a] tracking-tight">Setup your workspace</h1>
          <p className="text-[#627833] font-medium mt-2">Pick your focus for the upcoming S4. You can change this later.</p>
        </header>

        {/* Option Cards */}
        <div className="space-y-3">

          {/* SR AI Master Schedule Option */}
          {!isPastMasterSchedule && (
            <button
            onClick={() => setChoice('s4_master')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              choice === 's4_master'
                ? 'border-[#77bfa3] bg-[#bfd8bd]/10 shadow-[0_0_0_4px_rgba(119,191,163,0.1)]'
                : 'border-[#edeec9] bg-white hover:border-[#98c9a3] hover:bg-[#f8faf4]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                choice === 's4_master' ? 'bg-[#77bfa3] text-white' : 'bg-[#edeec9] text-[#3c7f65]'
              }`}>
                <Flame size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-[#313c1a] text-base">SR AI Master Schedule</h3>
                  <span className="text-[10px] font-bold text-white bg-[#fb923c] px-2 py-0.5 rounded-full uppercase tracking-wider">Recommended</span>
                </div>
                <p className="text-[#627833] text-sm leading-relaxed">
                  Intensive SR AI Roadmap (Apr 17–24). Optimized study path with automated task seeding.
                </p>
                <div className="flex items-center gap-2 mt-3 overflow-hidden whitespace-nowrap opacity-60">
                  <div className="text-[9px] font-bold text-[#50a987] bg-white border border-[#bfd8bd] px-2 py-0.5 rounded-md">Roadmap Seeded</div>
                  <div className="text-[9px] font-bold text-[#50a987] bg-white border border-[#bfd8bd] px-2 py-0.5 rounded-md">6 Slots Ready</div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${choice === 's4_master' ? 'border-[#77bfa3] bg-[#77bfa3]' : 'border-[#dde7c7]'}`}>
                {choice === 's4_master' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          </button>
          )}

          {/* S4 Basic Option */}
          <button
            onClick={() => setChoice('s4')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              choice === 's4'
                ? 'border-[#77bfa3] bg-[#bfd8bd]/10 shadow-[0_0_0_4px_rgba(119,191,163,0.1)]'
                : 'border-[#edeec9] bg-white hover:border-[#98c9a3] hover:bg-[#f8faf4]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                choice === 's4' ? 'bg-[#77bfa3] text-white' : 'bg-[#edeec9] text-[#3c7f65]'
              }`}>
                <Target size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#313c1a] text-base mb-1">Start with S4 (Flexible)</h3>
                <p className="text-[#627833] text-sm leading-relaxed">
                  Import the S4 structure only. You'll build your own schedule day by day.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${choice === 's4' ? 'border-[#77bfa3] bg-[#77bfa3]' : 'border-[#dde7c7]'}`}>
                {choice === 's4' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          </button>

          {/* Blank Option */}
          <button
            onClick={() => setChoice('blank')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
              choice === 'blank'
                ? 'border-[#77bfa3] bg-[#bfd8bd]/10 shadow-[0_0_0_4px_rgba(119,191,163,0.1)]'
                : 'border-[#edeec9] bg-white hover:border-[#98c9a3] hover:bg-[#f8faf4]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                choice === 'blank' ? 'bg-[#77bfa3] text-white' : 'bg-[#edeec9] text-[#3c7f65]'
              }`}>
                <BookOpen size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#313c1a] text-base mb-1">Start Blank</h3>
                <p className="text-[#627833] text-sm leading-relaxed">
                  Build your own plan from scratch. Add your own subjects, modules, and topics.
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${choice === 'blank' ? 'border-[#77bfa3] bg-[#77bfa3]' : 'border-[#dde7c7]'}`}>
                {choice === 'blank' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </div>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(119,191,163,0.35)]"
        >
          {isProcessing ? (
            <><Loader2 className="animate-spin" size={20} /> Setting up…</>
          ) : (
            <>Continue <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
