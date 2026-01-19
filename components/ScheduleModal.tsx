
import React from 'react';
import { createPortal } from 'react-dom';
import { CustardShop } from '../types';

interface ScheduleModalProps {
  shop: CustardShop;
  upcoming: any[];
  onClose: () => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ shop, upcoming, onClose }) => {
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-midnight-lake w-full max-w-lg max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 dark:border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-stone-900 dark:text-white">Full Schedule</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider">{shop.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 flex items-center justify-center hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {upcoming.map((day, idx) => (
            <div key={idx} className="flex gap-4 items-start border-b border-stone-50 dark:border-white/5 pb-4 last:border-0">
              <div className="w-12 flex-shrink-0 text-center">
                <p className="text-[10px] font-black uppercase text-sunrise-gold">
                  {new Date(day.date + 'T12:00:00').toLocaleDateString([], { weekday: 'short' })}
                </p>
                <p className="text-lg font-black text-stone-800 dark:text-stone-200 leading-none">
                  {new Date(day.date + 'T12:00:00').getDate()}
                </p>
              </div>
              <div className="flex-1 pt-1">
                {day.flavors.map((f: any, fIdx: number) => (
                  <p key={fIdx} className="font-bold text-stone-900 dark:text-stone-100 leading-tight mb-1">{f.name}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ScheduleModal;
