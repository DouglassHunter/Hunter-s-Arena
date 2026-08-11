import React from 'react';
import { Gamepad2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="bg-slate-950 border-t border-slate-800/80 mt-auto py-10 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand column */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <span className="font-extrabold text-white font-mono tracking-tight text-base">
              HUNTER'S<span className="text-cyan-400"> ARENA</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Real-time multiplayer & AI bot gaming platform. Play Tic-Tac-Toe and Rock-Paper-Scissors online.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 font-mono">
        <p>© 2026 Hunter's Arena. Competitive Online Gaming Platform.</p>
      </div>
    </footer>
  );
};
