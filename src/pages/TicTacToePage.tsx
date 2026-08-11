import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useSocket } from '../context/SocketContext.js';
import { useSound } from '../context/SoundContext.js';
import { useAuth } from '../context/AuthContext.js';
import { TicTacToeState } from '../types/index.js';
import { Trophy, Copy, Check, RefreshCw, ShieldAlert, X, HelpCircle, Shuffle, ArrowLeft, Bot, Zap } from 'lucide-react';

interface ColorScheme {
  id: string;
  name: string;
  text: string;
  border: string;
  bg: string;
  badgeBg: string;
  badgeBorder: string;
  glow: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'indigo', name: 'Indigo', text: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-600', badgeBg: 'bg-indigo-950/60', badgeBorder: 'border-indigo-500/80', glow: 'shadow-indigo-500/20' },
  { id: 'cyan', name: 'Cyan', text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-600', badgeBg: 'bg-cyan-950/60', badgeBorder: 'border-cyan-500/80', glow: 'shadow-cyan-500/20' },
  { id: 'rose', name: 'Rose', text: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-600', badgeBg: 'bg-rose-950/60', badgeBorder: 'border-rose-500/80', glow: 'shadow-rose-500/20' },
  { id: 'amber', name: 'Amber', text: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-600', badgeBg: 'bg-amber-950/60', badgeBorder: 'border-amber-500/80', glow: 'shadow-amber-500/20' },
  { id: 'emerald', name: 'Emerald', text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-600', badgeBg: 'bg-emerald-950/60', badgeBorder: 'border-emerald-500/80', glow: 'shadow-emerald-500/20' },
  { id: 'fuchsia', name: 'Fuchsia', text: 'text-fuchsia-400', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-600', badgeBg: 'bg-fuchsia-950/60', badgeBorder: 'border-fuchsia-500/80', glow: 'shadow-fuchsia-500/20' },
  { id: 'lime', name: 'Lime', text: 'text-lime-400', border: 'border-lime-500/40', bg: 'bg-lime-600', badgeBg: 'bg-lime-950/60', badgeBorder: 'border-lime-500/80', glow: 'shadow-lime-500/20' },
  { id: 'violet', name: 'Violet', text: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-600', badgeBg: 'bg-violet-950/60', badgeBorder: 'border-violet-500/80', glow: 'shadow-violet-500/20' }
];

function getRandomColorPair(): { schemeX: ColorScheme; schemeO: ColorScheme } {
  const idxX = Math.floor(Math.random() * COLOR_SCHEMES.length);
  let idxO = Math.floor(Math.random() * COLOR_SCHEMES.length);
  while (idxO === idxX) {
    idxO = Math.floor(Math.random() * COLOR_SCHEMES.length);
  }
  return { schemeX: COLOR_SCHEMES[idxX], schemeO: COLOR_SCHEMES[idxO] };
}

export const TicTacToePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playClick, playMove, playVictory, playDefeat, playDraw } = useSound();
  const {
    activeRoom,
    gameState,
    sendMove,
    requestRematch,
    leaveRoom,
    matchFinishedData,
    rematchRequested,
    myRematchRequested,
    sendEmote,
    latestEmote,
    opponentDisconnected,
    selectTicTacToeSide,
    setBotDifficulty
  } = useSocket();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [colorPair, setColorPair] = useState(() => getRandomColorPair());

  const tttState = gameState as TicTacToeState | null;

  useEffect(() => {
    if (tttState?.status === 'won') {
      setColorPair(getRandomColorPair());
      const isWinner = tttState.winnerId === user?.id || (activeRoom?.hostId === user?.id && tttState.winnerId === activeRoom.hostId);
      if (isWinner) {
        playVictory();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        playDefeat();
      }
    } else if (tttState?.status === 'draw') {
      setColorPair(getRandomColorPair());
      playDraw();
    }
  }, [tttState?.status]);

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-indigo-400" />
        <h2 className="text-2xl font-mono font-bold">No Active Room Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Please select or create a match room from the game lobby to start playing.
        </p>
        <button
          onClick={() => {
            playClick();
            navigate('/lobby');
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg"
        >
          GO TO LOBBY
        </button>
      </div>
    );
  }

  const isHost = activeRoom.hostId === user?.id;
  const playerX = tttState?.players?.X || {
    id: activeRoom.hostId,
    username: activeRoom.hostUsername,
    avatar: activeRoom.hostAvatar,
    rating: activeRoom.hostRating
  };
  const playerO = tttState?.players?.O || (activeRoom.guestUsername ? {
    id: activeRoom.guestId || '',
    username: activeRoom.guestUsername,
    avatar: activeRoom.guestAvatar,
    rating: activeRoom.guestRating
  } : null);

  const isPlayerX = playerX.id === user?.id || (isHost && playerX.id === activeRoom.hostId);
  const mySymbol = isPlayerX ? 'X' : 'O';
  const myTurn = tttState ? tttState.currentTurn === mySymbol : false;

  const handleCellClick = (index: number) => {
    if (!tttState || tttState.status !== 'active' || !tttState.sideChosen) return;
    if (!myTurn) return;
    if (tttState.board[index] !== null) return;

    playMove();
    sendMove({ cellIndex: index });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopiedCode(true);
    playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const triggerEmote = (emote: string) => {
    playClick();
    sendEmote(emote);
  };

  const handleSelectSide = (side: 'X' | 'O' | 'random') => {
    playClick();
    selectTicTacToeSide(side);
  };

  return (
    <div id="tic-tac-toe-game" className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Top Room Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3">
          <button
            onClick={() => {
              playClick();
              leaveRoom();
              navigate('/lobby');
            }}
            className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>LEAVE MATCH</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick();
                setShowHelpModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>HOW TO WIN</span>
            </button>

            <button
              onClick={copyRoomCode}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-400 font-mono text-xs font-bold tracking-widest flex items-center gap-2 transition-all shadow-sm"
            >
              <span>ROOM: {activeRoom.roomCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* AI BOT DIFFICULTY LEVEL SELECTOR BAR */}
        {(activeRoom.guestId === 'usr-bot' || activeRoom.hostId === 'usr-bot') && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>AI BOT DIFFICULTY</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                    (tttState?.botDifficulty || 'easy') === 'easy'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {(tttState?.botDifficulty || 'easy').toUpperCase()} MODE
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(tttState?.botDifficulty || 'easy') === 'easy'
                    ? '🟢 Easy: Suboptimal AI moves so wins are easier for you.'
                    : '🔴 Hard: Unbeatable Minimax AI algorithm.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  playClick();
                  setBotDifficulty('easy');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  (tttState?.botDifficulty || 'easy') === 'easy'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-400/50'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>EASY</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setBotDifficulty('hard');
                }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  tttState?.botDifficulty === 'hard'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20 ring-2 ring-rose-400/50'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>HARD</span>
              </button>
            </div>
          </div>
        )}

        {/* PRE-GAME SYMBOL / SIDE SELECTION BANNER / OVERLAY */}
        {tttState && tttState.status === 'active' && !tttState.sideChosen && (
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border-2 border-indigo-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                PRE-GAME SYMBOL SETUP
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-mono text-white">CHOOSE YOUR SYMBOL</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto font-mono">
                🎯 <strong className="text-indigo-400">How to Win:</strong> Align 3 of your symbols horizontally, vertically, or diagonally. Symbol <span className="text-indigo-400 font-bold">X always moves first</span>!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto font-mono">
              <button
                onClick={() => handleSelectSide('X')}
                className={`p-4 rounded-2xl ${colorPair.schemeX.badgeBg} hover:opacity-95 border-2 ${colorPair.schemeX.badgeBorder} text-white font-bold flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95 shadow-xl`}
              >
                <span className={`text-4xl font-black ${colorPair.schemeX.text} group-hover:scale-110 transition-transform`}>X</span>
                <span className="text-xs text-slate-200">PLAY AS X (START 1ST)</span>
              </button>

              <button
                onClick={() => handleSelectSide('O')}
                className={`p-4 rounded-2xl ${colorPair.schemeO.badgeBg} hover:opacity-95 border-2 ${colorPair.schemeO.badgeBorder} text-white font-bold flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95 shadow-xl`}
              >
                <span className={`text-4xl font-black ${colorPair.schemeO.text} group-hover:scale-110 transition-transform`}>O</span>
                <span className="text-xs text-slate-200">PLAY AS O (START 2ND)</span>
              </button>

              <button
                onClick={() => handleSelectSide('random')}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white font-bold flex flex-col items-center justify-center gap-2 group transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                <Shuffle className="w-9 h-9 text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-xs text-amber-300">RANDOM SYMBOL</span>
              </button>
            </div>
          </div>
        )}

        {/* OPPONENT DISCONNECTED / FORFEIT BANNER */}
        {opponentDisconnected && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-4 text-center font-mono text-xs animate-pulse">
            ⚠️ Opponent {opponentDisconnected.username} disconnected. Victory will be automatically granted if they do not reconnect...
          </div>
        )}

        {/* Players Score Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          
          <div className="grid grid-cols-3 items-center text-center">
            
            {/* Player 1 (X) */}
            <div className={`p-4 rounded-2xl transition-all relative ${tttState?.currentTurn === 'X' && tttState?.status === 'active' ? `${colorPair.schemeX.badgeBg} border ${colorPair.schemeX.border} shadow-lg ${colorPair.schemeX.glow}` : ''}`}>
              {latestEmote && latestEmote.username === playerX.username && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-indigo-500 text-2xl px-3 py-1 rounded-2xl shadow-2xl animate-bounce z-20 flex items-center gap-1 font-mono">
                  <span>{latestEmote.emote}</span>
                </div>
              )}
              <div className="relative inline-block">
                <img
                  src={playerX.avatar}
                  alt={playerX.username}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 ${colorPair.schemeX.badgeBorder} mx-auto object-cover shadow-md`}
                />
                <span className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl ${colorPair.schemeX.bg} border border-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-md`}>
                  X
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold font-mono text-white mt-3 truncate">{playerX.username}</h3>
              <p className="text-xs font-mono text-amber-400 mt-0.5">{playerX.rating} ELO</p>
            </div>

            {/* VS Status Center Indicator */}
            <div className="space-y-2">
              <div className="inline-block text-xl sm:text-2xl font-black font-mono text-slate-500 tracking-widest">
                VS
              </div>
              
              {activeRoom.status === 'waiting' ? (
                <div className="text-xs font-mono text-amber-400 font-bold animate-pulse">
                  Waiting for Player 2...
                </div>
              ) : tttState?.status === 'active' ? (
                <div className="text-xs font-mono font-bold text-cyan-400">
                  {myTurn ? "YOUR TURN!" : "OPPONENT'S TURN"}
                </div>
              ) : null}
            </div>

            {/* Player 2 (O) */}
            <div className={`p-4 rounded-2xl transition-all relative ${tttState?.currentTurn === 'O' && tttState?.status === 'active' ? `${colorPair.schemeO.badgeBg} border ${colorPair.schemeO.border} shadow-lg ${colorPair.schemeO.glow}` : ''}`}>
              {playerO ? (
                <>
                  {latestEmote && latestEmote.username === playerO.username && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-cyan-500 text-2xl px-3 py-1 rounded-2xl shadow-2xl animate-bounce z-20 flex items-center gap-1 font-mono">
                      <span>{latestEmote.emote}</span>
                    </div>
                  )}
                  <div className="relative inline-block">
                    <img
                      src={playerO.avatar}
                      alt={playerO.username}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 ${colorPair.schemeO.badgeBorder} mx-auto object-cover shadow-md`}
                    />
                    <span className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-xl ${colorPair.schemeO.bg} border border-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-md`}>
                      O
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold font-mono text-white mt-3 truncate">{playerO.username}</h3>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">{playerO.rating} ELO</p>
                </>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 mx-auto flex items-center justify-center text-slate-600 font-mono text-xs">
                  EMPTY
                </div>
              )}
            </div>

          </div>

        </div>

        {/* 3x3 Tic-Tac-Toe Grid */}
        <div className="flex justify-center my-6">
          <div className="grid grid-cols-3 gap-3.5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl max-w-md w-full aspect-square">
            {tttState?.board.map((cell, idx) => {
              const isWinningCell = tttState?.winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  disabled={!myTurn || cell !== null || tttState?.status !== 'active'}
                  onClick={() => handleCellClick(idx)}
                  className={`relative rounded-2xl font-mono text-5xl font-black flex items-center justify-center transition-all duration-200 aspect-square select-none ${
                    isWinningCell
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/30 scale-105'
                      : cell === 'X'
                      ? `bg-slate-950 ${colorPair.schemeX.text} border ${colorPair.schemeX.border} shadow-inner`
                      : cell === 'O'
                      ? `bg-slate-950 ${colorPair.schemeO.text} border ${colorPair.schemeO.border} shadow-inner`
                      : myTurn && tttState?.status === 'active'
                      ? 'bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950/60 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {cell && (
                    <span className="animate-in fade-in zoom-in duration-200">
                      {cell}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emotes Bar */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs font-mono text-slate-500">Quick Reactions:</span>
          {['🔥', '👏', '😱', '👑', '🗿'].map(e => (
            <button
              key={e}
              onClick={() => triggerEmote(e)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-base transition-transform active:scale-90"
            >
              {e}
            </button>
          ))}
        </div>

      </div>

      {/* MATCH COMPLETION OVERLAY MODAL */}
      {tttState && tttState.status !== 'active' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in duration-200 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => {
                playClick();
                leaveRoom();
                navigate('/lobby');
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            {tttState.status === 'won' ? (
              (() => {
                const isWinner = tttState.winnerId === user?.id || (isHost && tttState.winnerId === activeRoom.hostId);
                const winnerName = tttState.winnerSymbol && tttState.players?.[tttState.winnerSymbol]?.username
                  ? tttState.players[tttState.winnerSymbol].username
                  : (isHost ? (activeRoom.guestUsername || 'Opponent') : activeRoom.hostUsername);

                return isWinner ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                      <Trophy className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black font-mono text-emerald-400 tracking-wider">VICTORY!</h2>
                    <p className="text-sm font-mono text-slate-200 font-bold uppercase">
                      YOU WON THE MATCH!
                    </p>
                    {matchFinishedData?.ratingChanges?.[user?.id || ''] && (
                      <div className="inline-block px-4 py-1.5 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                        {matchFinishedData.ratingChanges[user?.id || ''] > 0 ? '+' : ''}{matchFinishedData.ratingChanges[user?.id || '']} Rating
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black font-mono text-rose-500 tracking-wider">DEFEAT!</h2>
                    <p className="text-sm font-mono text-slate-200 font-bold uppercase">
                      YOU LOST — {winnerName.toUpperCase()} WON THE MATCH!
                    </p>
                    {matchFinishedData?.ratingChanges?.[user?.id || ''] && (
                      <div className="inline-block px-4 py-1.5 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                        {matchFinishedData.ratingChanges[user?.id || ''] > 0 ? '+' : ''}{matchFinishedData.ratingChanges[user?.id || '']} Rating
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black font-mono text-amber-400 tracking-wider">DRAW!</h2>
                <p className="text-sm font-mono text-slate-400">The board filled with no line match.</p>
              </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button
                disabled={myRematchRequested && !rematchRequested}
                onClick={() => {
                  playClick();
                  requestRematch();
                }}
                className={`w-full py-3.5 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all ${
                  rematchRequested
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/30 animate-pulse'
                    : myRematchRequested
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-wait'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/20'
                }`}
              >
                {rematchRequested
                  ? "ACCEPT REMATCH ⚔️"
                  : myRematchRequested
                  ? "WAITING FOR OPPONENT..."
                  : "PLAY AGAIN"}
              </button>

              <button
                onClick={() => {
                  playClick();
                  leaveRoom();
                  navigate('/lobby');
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider rounded-xl"
              >
                RETURN TO LOBBY
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HOW TO WIN RULES MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black font-mono text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" /> TIC-TAC-TOE: HOW TO WIN
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-indigo-400">🎯 Objective:</p>
                <p className="text-slate-400 leading-relaxed">
                  Be the first player to place 3 of your mark symbols (<strong className="text-indigo-400">X</strong> or <strong className="text-cyan-400">O</strong>) in a continuous straight line.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-cyan-400">⚡ Winning Formations:</p>
                <p className="text-slate-400 leading-relaxed">
                  Lines can be formed <strong>Horizontally</strong> (row), <strong>Vertically</strong> (column), or <strong>Diagonally</strong> across the 3x3 grid.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-amber-400">⚔️ Turns & Symbol Selection:</p>
                <p className="text-slate-400 leading-relaxed">
                  Before moves start, pick <strong>X</strong> (moves 1st), <strong>O</strong> (moves 2nd), or <strong>Random</strong>. If all 9 cells fill without 3 in a row, the match ends in a <strong>Draw</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/20"
            >
              GOT IT, LET'S PLAY!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
