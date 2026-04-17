import React, { useState } from 'react';
import { Target, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataMutation } from '../../hooks/useData';

export default function OnboardingView({ onComplete }) {
  const [choice, setChoice] = useState('s4'); // 's4' or 'blank'
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useDataMutation();

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      if (choice === 's4') {
        await mutation.mutateAsync({ action: 'importS4' });
      } else {
        await mutation.mutateAsync({ action: 'startBlank' });
      }
      queryClient.invalidateQueries({ queryKey: ['appData'] });
      onComplete();
    } catch (err) {
      alert('Error setting up workspace: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fdfdf9]">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#bfd8bd]/30 border border-[#98c9a3]/50 flex items-center justify-center mb-4">
            <BookOpen className="text-[#3c7f65]" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-[#313c1a] tracking-tight">Choose Your Start</h1>
          <p className="text-[#627833] mt-2 font-medium">Pick a starting point for your study plan.</p>
        </div>

        {/* Option Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* S4 Option — Primary */}
          <button
            onClick={() => setChoice('s4')}
            className={`text-left p-6 rounded-2xl border-2 transition-all ${
              choice === 's4'
                ? 'border-[#77bfa3] bg-[#bfd8bd]/15 shadow-[0_0_0_4px_rgba(119,191,163,0.12)]'
                : 'border-[#dde7c7] bg-white hover:border-[#98c9a3] hover:bg-[#f8faf4]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              choice === 's4' ? 'bg-[#77bfa3] text-white' : 'bg-[#dde7c7] text-[#3c7f65]'
            }`}>
              <Target size={20} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-[#313c1a] text-lg">Start with S4</h3>
              <span className="text-[10px] font-bold text-[#3c7f65] bg-[#bfd8bd]/30 px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#98c9a3]/50">Recommended</span>
            </div>
            <p className="text-[#627833] text-sm leading-relaxed mb-4">
              Get all 6 S4 subjects, exam timetable (Apr–May 2026), and complete module-wise topic lists in one click.
            </p>
            <ul className="space-y-1.5">
              {['Maths · Apr 27', 'AI · Apr 29', 'OS · May 4', 'DBMS · May 7', 'ADSA · May 11', 'Economics · May 14'].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-[#50a987] font-semibold">
                  <span className="w-1 h-1 rounded-full bg-[#77bfa3]" />
                  {item}
                </li>
              ))}
            </ul>
          </button>

          {/* Blank Option */}
          <button
            onClick={() => setChoice('blank')}
            className={`text-left p-6 rounded-2xl border-2 transition-all ${
              choice === 'blank'
                ? 'border-[#77bfa3] bg-[#bfd8bd]/15 shadow-[0_0_0_4px_rgba(119,191,163,0.12)]'
                : 'border-[#dde7c7] bg-white hover:border-[#98c9a3] hover:bg-[#f8faf4]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
              choice === 'blank' ? 'bg-[#77bfa3] text-white' : 'bg-[#dde7c7] text-[#3c7f65]'
            }`}>
              <BookOpen size={20} />
            </div>
            <h3 className="font-bold text-[#313c1a] text-lg mb-2">Start Blank</h3>
            <p className="text-[#627833] text-sm leading-relaxed">
              Create your own custom study plan from scratch. Add your own subjects and topics.
            </p>
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={isProcessing}
          className="w-full py-4 rounded-xl bg-[#77bfa3] hover:bg-[#50a987] text-white font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(119,191,163,0.35)] hover:shadow-[0_6px_20px_rgba(119,191,163,0.45)]"
        >
          {isProcessing ? (
            <><Loader2 className="animate-spin" size={20} /> Setting up your workspace...</>
          ) : (
            <>Enter Workspace <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
