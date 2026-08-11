import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSound } from '../context/SoundContext.js';
import { useSocket } from '../context/SocketContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GameDefinition } from '../types/index.js';
import { Swords, ArrowRight, Grid3X3, Scissors, Play, ChevronRight, Activity, Bot, X } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { playClick } = useSound();
  const { user } = useAuth();
  const { createBotMatch } = useSocket();
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBotModal, setShowBotModal] = useState(false);

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        setGames(data.games || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleActionWithAuth = (action: () => void) => {
    playClick();
    if (!user) {
      navigate('/login');
      return;
    }
    action();
  };

  const handlePlayBot = (gameSlug: 'tic-tac-toe' | 'rock-paper-scissors') => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBotModal(false);
    createBotMatch(gameSlug);
    navigate('/lobby');
  };

  return (
    <div id="landing-page" className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-900">
        
        {/* Subtle Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">

          {/* Hero Title */}
          <h1 className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 leading-tight">
            HUNTER'S ARENA
          </h1>

          {/* Hero Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 font-normal leading-relaxed">
            Play online multiplayer or practice against smart AI bots in competitive games.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleActionWithAuth(() => navigate('/lobby'))}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white font-mono font-bold text-sm tracking-wider uppercase shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <Play className="w-5 h-5 fill-white group-hover:translate-x-0.5 transition-transform" />
              <span>ONLINE MULTIPLAYER</span>
            </button>

            <button
              onClick={() => handleActionWithAuth(() => setShowBotModal(true))}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 font-mono font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              <Bot className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>PLAY VS AI BOT</span>
            </button>
          </div>

        </div>
      </section>

      {/* FEATURED GAMES SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold font-mono text-white">FEATURED GAMES</h2>
          </div>
          <button
            onClick={() => handleActionWithAuth(() => navigate('/lobby'))}
            className="text-xs font-mono font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
          >
            <span>Browse All Rooms</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tic Tac Toe Card */}
          <div className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Grid3X3 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Multiplayer & AI Bot
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                  Tic-Tac-Toe
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Classic 3x3 strategic line match. Choose X or O before playing against online players or AI Bot!
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                onClick={() => handlePlayBot('tic-tac-toe')}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-mono text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>VS AI BOT</span>
              </button>

              <button
                onClick={() => handleActionWithAuth(() => navigate('/lobby?game=tic-tac-toe'))}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold tracking-wide shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 group-hover:shadow-indigo-600/40 transition-all"
              >
                <span>ONLINE 1V1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rock Paper Scissors Card */}
          <div className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  <Scissors className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Multiplayer & AI Bot
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold font-mono text-white group-hover:text-indigo-300 transition-colors">
                  Rock-Paper-Scissors
                </h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Fast-paced Best-of-5 duel. Lock in choice simultaneously vs players or test your mind games against AI Bot.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <button
                onClick={() => handlePlayBot('rock-paper-scissors')}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-mono text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>VS AI BOT</span>
              </button>

              <button
                onClick={() => handleActionWithAuth(() => navigate('/lobby?game=rock-paper-scissors'))}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wide shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 group-hover:shadow-cyan-600/40 transition-all"
              >
                <span>ONLINE 1V1</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Select Bot Mode Modal */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" /> CHOOSE GAME VS AI BOT
              </h3>
              <button
                onClick={() => setShowBotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Select which game mode you want to practice against our AI Bot:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handlePlayBot('tic-tac-toe')}
                className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between text-left transition-all font-mono group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Grid3X3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300">Tic-Tac-Toe vs Bot</h4>
                    <p className="text-xs text-slate-400">Choose X or O symbol and align 3 in a row</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => handlePlayBot('rock-paper-scissors')}
                className="w-full p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all font-mono group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300">RPS Duel vs Bot</h4>
                    <p className="text-xs text-slate-400">Best-of-5 simultaneous round duel</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM FEATURES */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold font-mono text-white">ENGINEERED FOR COMPETITION</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold font-mono text-white text-base">Player Statistics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track total games, win rates, current streaks, max streaks, and individual game title breakdown on your profile.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="font-bold font-mono text-white text-base">Competitive Matches</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Match history archived with full scores, timestamps, opponent details, and rating deltas available anytime.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
