import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useSocket } from '../context/SocketContext.js';
import { useSound } from '../context/SoundContext.js';
import { useAuth } from '../context/AuthContext.js';
import { RPSChoice, RPSState } from '../types/index.js';
import { Trophy, ArrowLeft, Lock, Copy, Check, Sparkles, ShieldAlert, X, HelpCircle } from 'lucide-react';

export const RPSPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playClick, playMove, playVictory, playDefeat, playDraw, playCountdown } = useSound();
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
    opponentDisconnected
  } = useSocket();

  const [copiedCode, setCopiedCode] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const rpsState = gameState as RPSState | null;

  useEffect(() => {
    if (rpsState?.status === 'match_end') {
      if (rpsState.matchWinnerId === user?.id) {
        playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        playDefeat();
      }
    }
  }, [rpsState?.status]);

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-cyan-400" />
        <h2 className="text-2xl font-mono font-bold">No Active Match Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">Please join a match room from the game lobby to start playing.</p>
        <button
          onClick={() => {
            playClick();
            navigate('/lobby');
          }}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg"
        >
          GO TO LOBBY
        </button>
      </div>
    );
  }

  const p1Id = activeRoom.hostId;
  const p2Id = activeRoom.guestId || '';
  const myChoice = rpsState?.choices?.[user?.id || ''];
  const myLocked = rpsState?.locked?.[user?.id || ''];

  const p1Score = rpsState?.scores?.[p1Id] || 0;
  const p2Score = rpsState?.scores?.[p2Id] || 0;

  const handleSelectChoice = (choice: RPSChoice) => {
    if (!rpsState || rpsState.status !== 'choosing') return;
    if (myLocked) return;

    playMove();
    sendMove({ choice });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(activeRoom.roomCode);
    setCopiedCode(true);
    playClick();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getChoiceInfo = (choice: string | null | undefined) => {
    switch (choice) {
      case 'rock': return { label: 'ROCK', icon: '🪨' };
      case 'paper': return { label: 'PAPER', icon: '📄' };
      case 'scissors': return { label: 'SCISSORS', icon: '✂️' };
      default: return { label: 'WAITING', icon: '❓' };
    }
  };

  return (
    <div id="rps-game-page" className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Top Room Header */}
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
              className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>HOW TO WIN</span>
            </button>

            <button
              onClick={copyRoomCode}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-400 font-mono text-xs font-bold tracking-widest flex items-center gap-2 transition-all"
            >
              <span>ROOM: {activeRoom.roomCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* OPPONENT DISCONNECTED / FORFEIT BANNER */}
        {opponentDisconnected && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-4 text-center font-mono text-xs animate-pulse">
            ⚠️ Opponent {opponentDisconnected.username} disconnected. Automatic victory will be granted if they do not reconnect...
          </div>
        )}

        {/* Scoreboard Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          
          <div className="grid grid-cols-3 items-center text-center">
            
            {/* Player 1 */}
            <div className="space-y-2 relative">
              {latestEmote && latestEmote.username === activeRoom.hostUsername && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-indigo-500 text-2xl px-3 py-1 rounded-2xl shadow-2xl animate-bounce z-20 flex items-center gap-1 font-mono">
                  <span>{latestEmote.emote}</span>
                </div>
              )}
              <img
                src={activeRoom.hostAvatar}
                alt={activeRoom.hostUsername}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-indigo-500 mx-auto object-cover shadow-md"
              />
              <p className="text-sm font-bold font-mono text-white truncate">{activeRoom.hostUsername}</p>
              <p className="text-xs font-mono text-amber-400">{activeRoom.hostRating} ELO</p>
            </div>

            {/* Score Summary */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block">ROUND {rpsState?.currentRound || 1} OF 5</span>
              <div className="text-3xl sm:text-5xl font-black font-mono text-white tracking-wider">
                {p1Score} - {p2Score}
              </div>
              <span className="text-[11px] font-mono text-cyan-400 block font-semibold">FIRST TO 3 WINS</span>
            </div>

            {/* Player 2 */}
            <div className="space-y-2 relative">
              {latestEmote && latestEmote.username === activeRoom.guestUsername && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-cyan-500 text-2xl px-3 py-1 rounded-2xl shadow-2xl animate-bounce z-20 flex items-center gap-1 font-mono">
                  <span>{latestEmote.emote}</span>
                </div>
              )}
              {activeRoom.guestUsername ? (
                <>
                  <img
                    src={activeRoom.guestAvatar}
                    alt={activeRoom.guestUsername}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-cyan-500 mx-auto object-cover shadow-md"
                  />
                  <p className="text-sm font-bold font-mono text-white truncate">{activeRoom.guestUsername}</p>
                  <p className="text-xs font-mono text-amber-400">{activeRoom.guestRating} ELO</p>
                </>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 mx-auto flex items-center justify-center text-slate-600 font-mono text-xs">
                  WAITING
                </div>
              )}
            </div>

          </div>

          {/* Rounds Progress Indicators */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
            {[1, 2, 3, 4, 5].map(r => {
              const hist = rpsState?.roundHistory?.[r - 1];
              return (
                <div
                  key={r}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold border transition-all ${
                    hist
                      ? hist.winnerId === user?.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : hist.winnerId === null
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : r === rpsState?.currentRound
                      ? 'bg-indigo-600/30 border-indigo-500 text-white animate-pulse'
                      : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}
                >
                  R{r}
                </div>
              );
            })}
          </div>

        </div>

        {/* ARENA REVEAL / CHOICE DISPLAY */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          
          {rpsState?.status === 'revealing' || rpsState?.status === 'match_end' ? (
            <div className="space-y-6 animate-in zoom-in duration-300">
              <p className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                {rpsState.lastRoundResult?.resultText}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-md mx-auto">
                {(() => {
                  const p1Choice = getChoiceInfo(rpsState.lastRoundResult?.choices[p1Id]);
                  const p2Choice = getChoiceInfo(rpsState.lastRoundResult?.choices[p2Id]);
                  return (
                    <>
                      <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2 flex flex-col items-center justify-center overflow-hidden">
                        <p className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase truncate w-full">{activeRoom.hostUsername}</p>
                        <div className="text-3xl sm:text-4xl my-1">{p1Choice.icon}</div>
                        <p className="text-xs sm:text-sm font-mono font-black text-indigo-400 tracking-wider truncate w-full">
                          {p1Choice.label}
                        </p>
                      </div>

                      <div className="p-4 sm:p-6 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2 flex flex-col items-center justify-center overflow-hidden">
                        <p className="text-[11px] sm:text-xs font-mono text-slate-400 uppercase truncate w-full">{activeRoom.guestUsername}</p>
                        <div className="text-3xl sm:text-4xl my-1">{p2Choice.icon}</div>
                        <p className="text-xs sm:text-sm font-mono font-black text-cyan-400 tracking-wider truncate w-full">
                          {p2Choice.label}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : myLocked ? (
            <div className="py-10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-lg font-bold font-mono text-amber-300">CHOICE LOCKED!</p>
              <p className="text-xs text-slate-400 font-mono">Waiting for opponent to submit choice...</p>
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <p className="text-sm font-bold font-mono text-white tracking-wide">MAKE YOUR MOVE</p>
              <p className="text-xs text-slate-400 font-mono">Select Rock, Paper, or Scissors for Round {rpsState?.currentRound}</p>
            </div>
          )}

          {/* CHOICE ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-4">
            {[
              { id: 'rock' as RPSChoice, label: 'ROCK', icon: '🪨', color: 'hover:border-indigo-500 hover:text-indigo-300' },
              { id: 'paper' as RPSChoice, label: 'PAPER', icon: '📄', color: 'hover:border-cyan-500 hover:text-cyan-300' },
              { id: 'scissors' as RPSChoice, label: 'SCISSORS', icon: '✂️', color: 'hover:border-emerald-500 hover:text-emerald-300' }
            ].map(btn => (
              <button
                key={btn.id}
                disabled={Boolean(myLocked) || rpsState?.status !== 'choosing'}
                onClick={() => handleSelectChoice(btn.id)}
                className={`p-3 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-center space-y-1.5 sm:space-y-3 transition-all duration-200 group overflow-hidden ${
                  myLocked || rpsState?.status !== 'choosing'
                    ? 'opacity-40 cursor-not-allowed'
                    : `cursor-pointer hover:scale-105 active:scale-95 shadow-xl ${btn.color}`
                }`}
              >
                <div className="text-2xl sm:text-4xl group-hover:scale-110 transition-transform leading-none">{btn.icon}</div>
                <div className="text-[10px] sm:text-xs font-extrabold tracking-wider whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{btn.label}</div>
              </button>
            ))}
          </div>

          {/* Quick Reactions Bar */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="text-xs font-mono text-slate-500">Quick Reactions:</span>
            {['🔥', '👏', '😱', '👑', '🗿'].map(e => (
              <button
                key={e}
                onClick={() => {
                  playClick();
                  sendEmote(e);
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-base transition-transform active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* MATCH END MODAL */}
      {rpsState && rpsState.status === 'match_end' && (
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
            
            {(() => {
              const isHost = activeRoom.hostId === user?.id;
              const isWinner = rpsState.matchWinnerId === user?.id;
              const opponentName = isHost ? (activeRoom.guestUsername || 'Opponent') : activeRoom.hostUsername;

              return isWinner ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-black font-mono text-cyan-400 tracking-wider">VICTORY!</h2>
                  <p className="text-sm font-mono text-white font-bold uppercase">
                    YOU WON THE BEST-OF-5 DUEL!
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
                  <p className="text-sm font-mono text-white font-bold uppercase">
                    YOU LOST — {opponentName.toUpperCase()} WON THE DUEL!
                  </p>
                  {matchFinishedData?.ratingChanges?.[user?.id || ''] && (
                    <div className="inline-block px-4 py-1.5 rounded-full bg-slate-950 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                      {matchFinishedData.ratingChanges[user?.id || ''] > 0 ? '+' : ''}{matchFinishedData.ratingChanges[user?.id || '']} Rating
                    </div>
                  )}
                </div>
              );
            })()}

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
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-500 hover:from-cyan-500 hover:to-indigo-400 text-white shadow-cyan-600/20'
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
                <HelpCircle className="w-5 h-5 text-cyan-400" /> RPS: HOW TO WIN
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
                <p className="font-bold text-cyan-400">🏆 Best of 5 Match Goal:</p>
                <p className="text-slate-400 leading-relaxed">
                  Be the first player to accumulate <strong>3 round wins</strong> to claim overall victory and ELO rating points!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-indigo-400">🪨 Choice Hierarchy:</p>
                <ul className="text-slate-400 leading-relaxed space-y-1 mt-1">
                  <li>• 🪨 <strong>Rock</strong> smashes ✂️ <strong>Scissors</strong></li>
                  <li>• ✂️ <strong>Scissors</strong> cuts 📄 <strong>Paper</strong></li>
                  <li>• 📄 <strong>Paper</strong> covers 🪨 <strong>Rock</strong></li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-amber-400">🤝 Round Ties:</p>
                <p className="text-slate-400 leading-relaxed">
                  If both players choose the same gesture in a round, it's a draw and no scores are awarded for that turn.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-600/20"
            >
              GOT IT, READY TO DUEL!
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
