import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.js';
import { useSound } from '../context/SoundContext.js';
import { Swords, UserPlus, Check, X, Flame, BellRing } from 'lucide-react';

export const NotificationOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { playClick } = useSound();
  const {
    incomingChallenge,
    incomingFriendRequest,
    declinedNotification,
    respondToChallenge,
    dismissFriendRequestNotification,
    dismissDeclinedNotification
  } = useSocket();

  if (!incomingChallenge && !incomingFriendRequest && !declinedNotification) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-auto font-mono">
      
      {/* 1v1 DUEL CHALLENGE NOTIFICATION */}
      {incomingChallenge && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400/80 rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-top duration-300 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Swords className="w-4 h-4 animate-bounce text-cyan-400" />
              <span>1v1 DUEL CHALLENGE!</span>
            </div>
            <button
              onClick={() => {
                playClick();
                respondToChallenge(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={incomingChallenge.challenger.avatar}
              alt={incomingChallenge.challenger.username}
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 object-cover"
            />
            <div>
              <p className="text-sm font-extrabold text-white">{incomingChallenge.challenger.username}</p>
              <p className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                <Flame className="w-3 h-3 text-amber-500" /> {incomingChallenge.challenger.rating} ELO
              </p>
              <p className="text-[11px] text-cyan-300 font-bold mt-0.5">
                Title: {incomingChallenge.gameName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                playClick();
                respondToChallenge(true);
                if (incomingChallenge.gameSlug === 'tic-tac-toe') {
                  navigate('/game/tic-tac-toe');
                } else if (incomingChallenge.gameSlug === 'rock-paper-scissors') {
                  navigate('/game/rock-paper-scissors');
                }
              }}
              className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>ACCEPT DUEL</span>
            </button>

            <button
              onClick={() => {
                playClick();
                respondToChallenge(false);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs"
            >
              DECLINE
            </button>
          </div>
        </div>
      )}

      {/* FRIEND REQUEST RECEIVED NOTIFICATION */}
      {incomingFriendRequest && (
        <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl p-4 shadow-2xl shadow-indigo-500/20 animate-in slide-in-from-top duration-300 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>FRIEND REQUEST RECEIVED</span>
            </div>
            <button
              onClick={() => {
                playClick();
                dismissFriendRequestNotification();
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={incomingFriendRequest.sender.avatar}
              alt={incomingFriendRequest.sender.username}
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover"
            />
            <div>
              <p className="text-sm font-bold text-white">{incomingFriendRequest.sender.username}</p>
              <p className="text-xs text-slate-400">sent you a friend request</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                playClick();
                dismissFriendRequestNotification();
                navigate('/friends');
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>VIEW REQUESTS</span>
            </button>
          </div>
        </div>
      )}

      {/* CHALLENGE DECLINED NOTIFICATION */}
      {declinedNotification && (
        <div className="bg-slate-900 border border-amber-500/60 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Swords className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-bold text-amber-300">{declinedNotification}</p>
          </div>
          <button
            onClick={() => {
              playClick();
              dismissDeclinedNotification();
            }}
            className="text-slate-400 hover:text-white font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
};
