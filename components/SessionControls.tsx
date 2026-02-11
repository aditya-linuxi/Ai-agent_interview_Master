import React from 'react';
import { Mic, PhoneOff, Settings } from 'lucide-react';

interface SessionControlsProps {
  onEnd: () => void;
  status: string;
}

const SessionControls: React.FC<SessionControlsProps> = ({ onEnd, status }) => {
  return (
    <div className="flex items-center justify-between bg-slate-900 border-t border-slate-800 p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
        </div>
        <span className="text-green-400 font-mono text-sm tracking-wider uppercase">{status}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-slate-400">
           <Mic size={16} />
           <span className="text-xs font-semibold">Voice Mode Active</span>
        </div>
        
        <button 
          onClick={onEnd}
          className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg transition-colors"
        >
          <PhoneOff size={18} />
          <span className="font-semibold">End Session</span>
        </button>
      </div>
    </div>
  );
};

export default SessionControls;
