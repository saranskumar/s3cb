import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, ChevronRight } from 'lucide-react';

export default function CustomClockPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);

  const modalRef = useRef(null);

  // Parse `HH:mm` (24h) string into local states
  useEffect(() => {
    if (value && value.includes(':')) {
      const [hStr, mStr] = value.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      
      const pm = h >= 12;
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      
      setHour12(h);
      setMinute(m);
      setIsPM(pm);
    }
  }, [value, isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Scroll active elements into view when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const activeHour = document.getElementById('hour-' + hour12);
        const activeMin = document.getElementById('minute-' + minute);
        if (activeHour) activeHour.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (activeMin) activeMin.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  const applyTime = () => {
    let finalH = hour12;
    if (isPM && finalH !== 12) finalH += 12;
    if (!isPM && finalH === 12) finalH = 0;
    
    const outValue = `${finalH.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(outValue);
    setIsOpen(false);
  };

  const formatDisplay = (h, m, pm) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#dde7c7] bg-white hover:border-[#77bfa3] transition-all"
      >
        <div className="flex items-center gap-2">
           <Clock size={16} className="text-[#98c9a3]" />
           <span className="text-sm font-black text-[#313c1a]">
             {value ? formatDisplay(hour12, minute, isPM) : 'Select Time'}
           </span>
        </div>
        <ChevronRight size={14} className="text-[#c1c8a9]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div ref={modalRef} className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-[#edeec9] p-6 animate-in slide-in-from-bottom-4 duration-300">
             
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#3c7f65] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Select Time
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-[#98c9a3] hover:text-[#313c1a] transition-all">
                  <X size={20} />
                </button>
             </div>

             {/* Live Current Selection Header */}
             <div className="flex items-center justify-center gap-2 mb-6 bg-[#f8faf4] p-4 rounded-2xl border border-[#edeec9]">
                 <div className="text-4xl font-black text-[#313c1a]">
                   {hour12.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                   <span className="text-2xl text-[#fb923c] ml-2">{isPM ? 'PM' : 'AM'}</span>
                 </div>
             </div>

             {/* Scrolling Columns Container */}
             <div className="flex bg-[#fdfdf9] border-2 border-[#edeec9] rounded-2xl h-56 mb-8 relative overflow-hidden">
                
                {/* Visual Selection Bar (Center) */}
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-[#77bfa3]/10 border-y border-[#77bfa3]/30 pointer-events-none"></div>

                {/* Hours Column */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory bg-white border-r border-[#edeec9]/50">
                   <div className="h-20"></div> {/* Top Padding for snap */}
                   {hoursList.map(h => (
                     <button
                       key={h}
                       id={`hour-${h}`}
                       onClick={() => setHour12(h)}
                       className={`w-full h-12 flex items-center justify-center snap-center text-xl font-black transition-all ${hour12 === h ? 'text-[#313c1a] scale-110' : 'text-[#c1c8a9] hover:text-[#77bfa3]'}`}
                     >
                       {h.toString().padStart(2, '0')}
                     </button>
                   ))}
                   <div className="h-20"></div> {/* Bottom Padding for snap */}
                </div>

                {/* Minutes Column */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory bg-white border-r border-[#edeec9]/50">
                   <div className="h-20"></div>
                   {minutesList.map(m => (
                     <button
                       key={m}
                       id={`minute-${m}`}
                       onClick={() => setMinute(m)}
                       className={`w-full h-12 flex items-center justify-center snap-center text-xl font-black transition-all ${minute === m ? 'text-[#313c1a] scale-110' : 'text-[#c1c8a9] hover:text-[#77bfa3]'}`}
                     >
                       {m.toString().padStart(2, '0')}
                     </button>
                   ))}
                   <div className="h-20"></div>
                </div>

                {/* AM/PM Column */}
                <div className="flex-1 bg-white flex flex-col items-center justify-center px-4 gap-4 relative z-10">
                   <button
                     onClick={() => setIsPM(false)}
                     className={`w-full py-3 rounded-xl font-black transition-all ${!isPM ? 'bg-[#fb923c] text-white shadow-md' : 'bg-[#f8faf4] text-[#c1c8a9] hover:bg-[#edeec9]'}`}
                   >
                     AM
                   </button>
                   <button
                     onClick={() => setIsPM(true)}
                     className={`w-full py-3 rounded-xl font-black transition-all ${isPM ? 'bg-[#77bfa3] text-white shadow-md' : 'bg-[#f8faf4] text-[#c1c8a9] hover:bg-[#edeec9]'}`}
                   >
                     PM
                   </button>
                </div>

             </div>

             <button 
               onClick={applyTime}
               className="w-full py-4 bg-[#313c1a] hover:bg-black text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg"
             >
               Confirm Time
             </button>
          </div>
        </div>
      )}
    </>
  );
}
