import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { MatchHistoryItem } from '../types/index.js';
import { History, Shield, Calendar, Trophy, ChevronRight, X } from 'lucide-react';

export const MatchHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { playClick } = useSound();

  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [filterGame, setFilterGame] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<MatchHistoryItem | null>(null);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => setMatches(data.matches || []))
      .catch(() => {});
  }, []);

  const filteredMatches = matches.filter(m => {
    if (filterGame !== 'all' && m.gameSlug !== filterGame) return false;
    return true;
  });

  return (
    <div id="match-history-page" className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Competitive Logs</span>
            </div>
            <h1 className="text-3xl font-black font-mono text-white">MATCH HISTORY</h1>
            <p className="text-xs text-slate-400 mt-1">
              Archived logs of completed 1v1 matches, scores, and ELO rating adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { playClick(); setFilterGame('all'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterGame === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              ALL
            </button>
            <button
              onClick={() => { playClick(); setFilterGame('tic-tac-toe'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterGame === 'tic-tac-toe' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              TIC-TAC-TOE
            </button>
            <button
              onClick={() => { playClick(); setFilterGame('rock-paper-scissors'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${filterGame === 'rock-paper-scissors' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              RPS
            </button>
          </div>
        </div>

        {/* Matches List */}
        <div className="space-y-3 font-mono">
          {filteredMatches.map(m => {
            const isP1 = m.player1.id === user?.id;
            const myPlayer = isP1 ? m.player1 : m.player2;
            const oppPlayer = isP1 ? m.player2 : m.player1;
            const isWon = m.winnerId === myPlayer.id;
            const isDraw = m.winnerId === null;
            const ratingDelta = m.ratingChanges?.[myPlayer.id] || 0;

            return (
              <div
                key={m.id}
                onClick={() => { playClick(); setSelectedMatch(m); }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-lg group"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wider ${
                    isWon
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : isDraw
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isWon ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                  </span>

                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{m.gameName}</h4>
                    <p className="text-xs text-slate-400">vs {oppPlayer.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{m.scoreText}</p>
                    <p className={`text-xs font-bold ${ratingDelta > 0 ? 'text-emerald-400' : ratingDelta < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                      {ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta} ELO
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-cyan-400" /> Match Details Log
              </h3>
              <button onClick={() => setSelectedMatch(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Title</p>
                  <p className="text-sm font-bold text-white">{selectedMatch.gameName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="text-xs font-bold text-cyan-400">{selectedMatch.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-center space-y-1">
                  <p className="text-xs text-slate-400 truncate">{selectedMatch.player1.username}</p>
                  <p className="text-xl font-bold text-indigo-400">P1</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-center space-y-1">
                  <p className="text-xs text-slate-400 truncate">{selectedMatch.player2.username}</p>
                  <p className="text-xl font-bold text-cyan-400">P2</p>
                </div>
              </div>

              <div className="text-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-xs text-slate-400">Score Result</p>
                <p className="text-2xl font-black text-amber-400">{selectedMatch.scoreText}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedMatch(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
