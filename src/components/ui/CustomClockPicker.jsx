import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, ChevronRight } from 'lucide-react';

export default function CustomClockPicker({ value, onChange, trigger }) {
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

  const handleScrollHour = (e) => {
    const idx = Math.round(e.target.scrollTop / 56);
    if (hoursList[idx]) setHour12(hoursList[idx]);
  };

  const handleScrollMinute = (e) => {
    const idx = Math.round(e.target.scrollTop / 56);
    if (minutesList[idx] !== undefined) setMinute(minutesList[idx]);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
          {trigger}
        </div>
      ) : (
        <button 
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border-2 border-[#edeec9] bg-gradient-to-br from-white to-[#fdfdf9] hover:border-[#77bfa3] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#f0f9f5] flex items-center justify-center text-[#77bfa3] group-hover:scale-110 transition-transform">
               <Clock size={14} strokeWidth={3} />
             </div>
             <div className="text-left flex flex-col">
               <span className="text-xs font-bold text-[#627833] uppercase tracking-widest opacity-60 leading-none mb-1">Alert Time</span>
               <span className="text-lg font-black text-[#313c1a] leading-none">
                 {value ? (
                   <>
                     {hour12.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} 
                     <span className="text-[#fb923c] text-sm ml-1">{isPM ? 'PM' : 'AM'}</span>
                   </>
                 ) : 'Not Set'}
               </span>
             </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#f8faf4] group-hover:bg-[#77bfa3] group-hover:text-white text-[#c1c8a9] transition-colors">
            <ChevronRight size={18} />
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div ref={modalRef} className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-[#edeec9] p-6 animate-in slide-in-from-bottom-4 duration-300">
             
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#3c7f65] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Set Reminder
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-[#98c9a3] hover:text-[#313c1a] transition-all bg-[#f8faf4] p-2 rounded-full">
                  <X size={16} strokeWidth={3} />
                </button>
             </div>

             {/* Scrolling Columns Container */}
             <div className="flex bg-[#fdfdf9] border-2 border-[#edeec9] rounded-3xl h-64 mb-6 relative overflow-hidden shadow-inner mt-4">
                
                {/* Visual Selection Bar (Center) */}
                <div className="absolute top-1/2 left-4 right-4 h-14 -translate-y-1/2 bg-[#77bfa3]/15 border-y border-[#77bfa3]/40 pointer-events-none rounded-xl">
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center font-black text-2xl text-[#313c1a] opacity-30 pb-1">:</div>
                </div>

                {/* Hours Column */}
                <div 
                  onScroll={handleScrollHour}
                  className="flex-1 overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory bg-transparent relative z-10"
                >
                   <div className="h-[100px]"></div> {/* Top Padding for snap */}
                   {hoursList.map(h => (
                     <button
                       key={h}
                       id={`hour-${h}`}
                       onClick={() => setHour12(h)}
                       className={`w-full h-14 flex items-center justify-center snap-center font-black transition-all ${hour12 === h ? 'text-[#313c1a] text-4xl scale-110' : 'text-[#c1c8a9] text-xl hover:text-[#77bfa3]'}`}
                     >
                       {h.toString().padStart(2, '0')}
                     </button>
                   ))}
                   <div className="h-[100px]"></div> {/* Bottom Padding for snap */}
                </div>

                {/* Minutes Column */}
                <div 
                  onScroll={handleScrollMinute}
                  className="flex-1 overflow-y-auto no-scrollbar scroll-smooth snap-y snap-mandatory bg-transparent relative z-10"
                >
                   <div className="h-[100px]"></div>
                   {minutesList.map(m => (
                     <button
                       key={m}
                       id={`minute-${m}`}
                       onClick={() => setMinute(m)}
                       className={`w-full h-14 flex items-center justify-center snap-center font-black transition-all ${minute === m ? 'text-[#313c1a] text-4xl scale-110' : 'text-[#c1c8a9] text-xl hover:text-[#77bfa3]'}`}
                     >
                       {m.toString().padStart(2, '0')}
                     </button>
                   ))}
                   <div className="h-[100px]"></div>
                </div>

                {/* AM/PM Column */}
                <div className="flex-1 bg-white flex flex-col items-center justify-center px-3 gap-3 relative z-10 shadow-[-10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                   <button
                     onClick={() => setIsPM(false)}
                     className={`w-full py-3.5 rounded-2xl font-black transition-all ${!isPM ? 'bg-[#fb923c] text-white shadow-md' : 'bg-[#f8faf4] text-[#c1c8a9] hover:bg-[#edeec9]'}`}
                   >
                     AM
                   </button>
                   <button
                     onClick={() => setIsPM(true)}
                     className={`w-full py-3.5 rounded-2xl font-black transition-all ${isPM ? 'bg-[#77bfa3] text-white shadow-md' : 'bg-[#f8faf4] text-[#c1c8a9] hover:bg-[#edeec9]'}`}
                   >
                     PM
                   </button>
                </div>

             </div>

             <button 
               onClick={applyTime}
               className="w-full py-4 bg-[#313c1a] hover:bg-black text-[#edeec9] hover:text-white font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-lg active:scale-95"
             >
               Confirm Selection
             </button>
          </div>
        </div>
      )}
    </>
  );
}
