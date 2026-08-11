import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { LeaderboardEntry } from '../types/index.js';
import { Trophy, Flame, Flame as StreakIcon, Medal, RefreshCw, Grid3X3, HandMetal, Globe, Calendar, HelpCircle, X, ShieldCheck } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { playClick } = useSound();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [gameFilter, setGameFilter] = useState<'all' | 'tic-tac-toe' | 'rock-paper-scissors'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showEloModal, setShowEloModal] = useState<boolean>(false);

  const fetchLeaderboard = () => {
    setIsLoading(true);
    fetch(`/api/leaderboard?game=${gameFilter}&timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, gameFilter]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 font-mono font-bold flex items-center justify-center text-xs shadow-md">#1</span>;
    if (rank === 2) return <span className="w-7 h-7 rounded-lg bg-slate-400/20 border border-slate-400 text-slate-200 font-mono font-bold flex items-center justify-center text-xs shadow-md">#2</span>;
    if (rank === 3) return <span className="w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700 text-amber-500 font-mono font-bold flex items-center justify-center text-xs shadow-md">#3</span>;
    return <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs flex items-center justify-center">#{rank}</span>;
  };

  return (
    <div id="leaderboard-page" className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Leaderboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4" />
              <span>Global Rankings</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black font-mono text-white">LEADERBOARD</h1>
              <button
                onClick={() => {
                  playClick();
                  setShowEloModal(true);
                }}
                className="p-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 text-xs font-mono font-bold"
                title="How ELO Ratings Work"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">ELO INFO</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Top rated competitive players on Hunter's Arena. Earn ELO points by winning 1v1 matches.
            </p>
          </div>

          <button
            onClick={() => {
              playClick();
              fetchLeaderboard();
            }}
            className="self-start md:self-auto p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-2 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3">
          
          {/* Timeframe Tabs */}
          <div className="flex items-center gap-1 font-mono text-xs bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto whitespace-nowrap max-w-full">
            {[
              { id: 'global' as const, label: 'GLOBAL', icon: Globe },
              { id: 'weekly' as const, label: 'WEEKLY', icon: Calendar },
              { id: 'monthly' as const, label: 'MONTHLY', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playClick();
                    setTimeframe(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
                    timeframe === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Game Selection Filters */}
          <div className="flex items-center gap-1 font-mono text-xs bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto whitespace-nowrap max-w-full">
            <button
              onClick={() => {
                playClick();
                setGameFilter('all');
              }}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                gameFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL GAMES
            </button>
            <button
              onClick={() => {
                playClick();
                setGameFilter('tic-tac-toe');
              }}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                gameFilter === 'tic-tac-toe' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              TIC-TAC-TOE
            </button>
            <button
              onClick={() => {
                playClick();
                setGameFilter('rock-paper-scissors');
              }}
              className={`px-3 py-2 rounded-lg font-bold transition-all ${
                gameFilter === 'rock-paper-scissors' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              RPS
            </button>
          </div>

        </div>

        {/* Leaderboard Table / List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Rank</th>
                  <th className="py-4 px-6 font-semibold">Player</th>
                  <th className="py-4 px-6 font-semibold text-right">Rating</th>
                  <th className="py-4 px-6 font-semibold text-right">Total Games</th>
                  <th className="py-4 px-6 font-semibold text-right">Wins</th>
                  <th className="py-4 px-6 font-semibold text-right">Win Rate</th>
                  <th className="py-4 px-6 font-semibold text-right">Win Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {leaderboard.map(item => {
                  const isCurrentUser = item.id === user?.id;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-800/50 ${
                        isCurrentUser ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500' : ''
                      }`}
                    >
                      <td className="py-4 px-6">{getRankBadge(item.rank)}</td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                          />
                          <div>
                            <p className="font-bold text-white flex items-center gap-2">
                              <span>{item.username}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 text-[10px] uppercase font-semibold">
                                  YOU
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right font-bold text-amber-400 font-mono text-sm">
                        {item.rating}
                      </td>

                      <td className="py-4 px-6 text-right text-slate-300">
                        {item.totalGames}
                      </td>

                      <td className="py-4 px-6 text-right text-emerald-400 font-semibold">
                        {item.wins}
                      </td>

                      <td className="py-4 px-6 text-right text-cyan-400 font-semibold">
                        {item.winRate}%
                      </td>

                      <td className="py-4 px-6 text-right font-bold text-orange-400">
                        {item.winStreak > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
                            {item.winStreak}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      {/* ELO EXPLANATION POPUP MODAL */}
      {showEloModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Top Close Button */}
            <button
              onClick={() => {
                playClick();
                setShowEloModal(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              aria-label="Close ELO Info"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-mono text-white">HOW ELO & RATINGS WORK</h2>
                <p className="text-xs font-mono text-cyan-400">Competitive Skill & Matchmaking</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-amber-400 text-sm">1. Starting ELO Rating</span>
                <p className="text-slate-400">
                  Every new player starts with a base rating of <span className="text-white font-bold">1200 ELO</span>. Winning matches increases your rating, while losing matches decreases it.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-cyan-400 text-sm">2. Opponent Strength Factor</span>
                <p className="text-slate-400">
                  Beating a higher-rated player yields significantly <span className="text-emerald-400 font-bold">+more points</span> than defeating a lower-rated player. Defeats against lower-ranked opponents result in larger point drops.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-bold text-emerald-400 text-sm">3. Draws & Streaks</span>
                <p className="text-slate-400">
                  Draws maintain rating stability with minimal changes based on opponent rating gaps. Active win streaks boost your ranking position on tie-breakers!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playClick();
                setShowEloModal(false);
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              GOT IT, THANKS!
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
