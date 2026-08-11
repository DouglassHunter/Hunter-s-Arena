import React from 'react';
import { useSocket } from '../context/SocketContext.js';
import { Wifi, WifiOff } from 'lucide-react';

export const ConnectionStatus: React.FC = () => {
  const { connectionStatus, opponentDisconnected } = useSocket();

  return (
    <>
      <div id="connection-status-badge" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] sm:text-xs font-medium backdrop-blur-md flex-shrink-0">
        {connectionStatus === 'connected' ? (
          <>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline text-emerald-400 font-mono tracking-wide whitespace-nowrap">Connected</span>
          </>
        ) : connectionStatus === 'connecting' ? (
          <>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="hidden sm:inline text-amber-400 font-mono tracking-wide whitespace-nowrap">Reconnecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="hidden sm:inline text-rose-400 font-mono tracking-wide whitespace-nowrap">Disconnected</span>
          </>
        )}
      </div>

      {opponentDisconnected && (
        <div id="opponent-disconnect-banner" className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-lg backdrop-blur-md shadow-xl flex items-center gap-3 animate-bounce">
          <Wifi className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Connection Warning</p>
            <p className="text-sm font-medium">Opponent disconnected ({opponentDisconnected.username}). Waiting for reconnection...</p>
          </div>
        </div>
      )}
    </>
  );
};
