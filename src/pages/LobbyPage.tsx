import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.js';
import { useSound } from '../context/SoundContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GameRoom, GameSlug } from '../types/index.js';
import { Gamepad2, Users, Plus, Key, Search, RefreshCw, Lock, Globe, Grid3X3, HandMetal, ArrowRight, Loader2, Sparkles, Bot } from 'lucide-react';

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGameFilter = searchParams.get('game') || 'all';

  const { user } = useAuth();
  const { playClick } = useSound();
  const {
    activeRoom,
    createRoom,
    createBotMatch,
    joinRoom,
    findMatch,
    cancelMatchmaking,
    isSearching,
    searchGameSlug
  } = useSocket();

  const [selectedGame, setSelectedGame] = useState<string>(initialGameFilter);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createGameSlug, setCreateGameSlug] = useState<GameSlug>('tic-tac-toe');
  const [isPrivateRoom, setIsPrivateRoom] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active public rooms
  const fetchRooms = () => {
    setIsLoadingRooms(true);
    fetch(`/api/rooms?game=${selectedGame}`)
      .then(res => res.json())
      .then(data => {
        setPublicRooms(data.rooms || []);
        setIsLoadingRooms(false);
      })
      .catch(() => setIsLoadingRooms(false));
  };

  useEffect(() => {
    fetchRooms();
    const timer = setInterval(fetchRooms, 4000);
    return () => clearInterval(timer);
  }, [selectedGame]);

  // If in an active match or room, navigate to game view
  useEffect(() => {
    if (activeRoom) {
      if (activeRoom.gameSlug === 'tic-tac-toe') {
        navigate('/game/tic-tac-toe');
      } else if (activeRoom.gameSlug === 'rock-paper-scissors') {
        navigate('/game/rock-paper-scissors');
      }
    }
  }, [activeRoom, navigate]);

  const checkAuthOrRedirect = (): boolean => {
    if (!user) {
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuthOrRedirect()) return;
    if (!joinCodeInput.trim()) return;
    playClick();
    setErrorMsg(null);
    joinRoom(joinCodeInput.trim().toUpperCase());
  };

  const handleCreateRoomSubmit = () => {
    if (!checkAuthOrRedirect()) return;
    playClick();
    createRoom(createGameSlug, isPrivateRoom);
    setShowCreateModal(false);
  };

  const handleStartMatchmaking = (slug: GameSlug) => {
    if (!checkAuthOrRedirect()) return;
    playClick();
    findMatch(slug);
  };

  const handleStartBotMatch = (slug: GameSlug) => {
    if (!checkAuthOrRedirect()) return;
    playClick();
    createBotMatch(slug);
  };

  return (
    <div id="game-lobby-page" className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Lobby Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-1">
              <Gamepad2 className="w-4 h-4" />
              <span>Multiplayer & AI Practice Hub</span>
            </div>
            <h1 className="text-3xl font-black font-mono text-white">THIS IS THE LOBBY</h1>
            <p className="text-xs text-slate-400 mt-1">
              Create a custom room, enter a code, or play instantly vs AI bots or online matchmaking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!checkAuthOrRedirect()) return;
                playClick();
                setShowCreateModal(true);
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE ROOM</span>
            </button>
          </div>
        </div>

        {/* AI Practice & Matchmaking Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* AI Bot Quick Play */}
          <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>Practice vs AI Bot</span>
            </div>
            <p className="text-xs text-slate-400">
              Instant single-player match against our smart AI bot opponent. No queue time!
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleStartBotMatch('tic-tac-toe')}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <Grid3X3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Tic-Tac-Toe vs Bot</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleStartBotMatch('rock-paper-scissors')}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-left transition-all font-mono"
              >
                <div className="flex items-center gap-2.5">
                  <HandMetal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">RPS Duel vs Bot</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
          
          {/* Quick Matchmaking Widget */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Instant Online Matchmaking</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Queue into automated 1v1 matchmaking against another player online with similar rating.
            </p>

            {isSearching ? (
              <div className="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <div>
                    <p className="text-sm font-bold font-mono text-white">Searching for Opponent...</p>
                    <p className="text-xs text-indigo-300 font-mono">Game: {searchGameSlug?.toUpperCase()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    cancelMatchmaking();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold rounded-lg"
                >
                  Cancel Queue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleStartMatchmaking('tic-tac-toe')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Grid3X3 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-mono text-white group-hover:text-cyan-300">Tic-Tac-Toe</p>
                      <p className="text-[10px] text-slate-400 font-mono">Online 1v1</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleStartMatchmaking('rock-paper-scissors')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <HandMetal className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold font-mono text-white group-hover:text-indigo-300">Rock-Paper-Scissors</p>
                      <p className="text-[10px] text-slate-400 font-mono">Online Duel</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}
          </div>

          {/* Join Private Room Code Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Key className="w-4 h-4" />
                <span>Join with Room Code</span>
              </div>
              <p className="text-xs text-slate-400">
                Have a room code? Enter it below (e.g. <code className="text-cyan-400 font-bold font-mono">X7K92P</code>).
              </p>
            </div>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full uppercase font-mono tracking-widest text-center text-base font-bold bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-xl uppercase tracking-wider transition-colors"
              >
                JOIN ROOM
              </button>
            </form>
          </div>

        </div>

        {/* Public Available Rooms Table / Cards */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold font-mono text-white">PUBLIC MATCHES</h2>
              <button
                onClick={() => {
                  playClick();
                  fetchRooms();
                }}
                title="Refresh rooms"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Filter Game Selector */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Filter:</span>
              <button
                onClick={() => setSelectedGame('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedGame === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedGame('tic-tac-toe')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedGame === 'tic-tac-toe' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Tic-Tac-Toe
              </button>
              <button
                onClick={() => setSelectedGame('rock-paper-scissors')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  selectedGame === 'rock-paper-scissors' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                RPS
              </button>
            </div>
          </div>

          {/* Rooms Grid */}
          {publicRooms.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
              <Globe className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-mono font-bold text-slate-300">No Open Public Rooms Right Now</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a new public room or use instant matchmaking to get matched with an opponent right away!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl"
              >
                CREATE ROOM
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicRooms.map(room => (
                <div
                  key={room.roomCode}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 text-indigo-400 font-mono text-xs font-bold tracking-wider border border-slate-800">
                      ROOM: {room.roomCode}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                      {room.gameName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={room.hostAvatar}
                      alt={room.hostUsername}
                      className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{room.hostUsername}</p>
                      <p className="text-xs text-amber-400 font-mono">{room.hostRating} ELO</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{room.currentPlayers}/2 Players</span>
                    </div>

                    <button
                      onClick={() => {
                        if (!checkAuthOrRedirect()) return;
                        playClick();
                        joinRoom(room.roomCode);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold rounded-lg text-xs"
                    >
                      JOIN MATCH
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /> CREATE NEW MATCH ROOM
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Select Game */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase">Select Title</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCreateGameSlug('tic-tac-toe')}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                    createGameSlug === 'tic-tac-toe'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5 text-indigo-400" />
                  <span>Tic-Tac-Toe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateGameSlug('rock-paper-scissors')}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                    createGameSlug === 'rock-paper-scissors'
                      ? 'bg-cyan-600/20 border-cyan-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <HandMetal className="w-5 h-5 text-cyan-400" />
                  <span>Rock-Paper-Scissors</span>
                </button>
              </div>
            </div>

            {/* Privacy Setting */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 font-bold uppercase">Privacy Setting</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivateRoom(false)}
                  className={`p-3 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    !isPrivateRoom
                      ? 'bg-slate-800 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Public Room</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivateRoom(true)}
                  className={`p-3 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isPrivateRoom
                      ? 'bg-slate-800 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Private Code</span>
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoomSubmit}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl"
              >
                START ROOM
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
