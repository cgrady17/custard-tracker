import React from 'react';
import { createPortal } from 'react-dom';

interface InstallPromptModalProps {
  onClose: () => void;
}

const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ onClose }) => {
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-cream-city dark:bg-mke-blue border-2 border-sunrise-gold rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-2xl shadow-md flex items-center justify-center mb-6">
            <img src="/favicon.svg" alt="App Icon" className="w-10 h-10" />
          </div>
          
          <h3 className="text-xl font-black text-mke-blue dark:text-stone-100 uppercase tracking-tight mb-2">
            Enable Notifications
          </h3>
          
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
            To get flavor alerts on iPhone/iPad, you must add this website to your home screen first.
          </p>

          <div className="w-full bg-white dark:bg-stone-800/50 rounded-xl p-4 text-left space-y-3 mb-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-500">1</span>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Tap the <span className="text-lake-blue">Share</span> icon below</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-500">2</span>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Select <span className="text-stone-900 dark:text-white font-black">Add to Home Screen</span></span>
            </div>
          </div>
          
          <div className="mt-4 text-[10px] text-stone-400 italic">
            Then open the app from your home screen to subscribe!
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InstallPromptModal;
