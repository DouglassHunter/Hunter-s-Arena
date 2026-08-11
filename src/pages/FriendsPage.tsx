import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { useSocket } from '../context/SocketContext.js';
import { FriendItem } from '../types/index.js';
import { Users, UserPlus, Gamepad2, Flame, Check, X, Search, Swords, UserX, Loader2, Sparkles } from 'lucide-react';

interface SearchedUser {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  friendshipStatus: 'friend' | 'pending_sent' | 'pending_received' | 'none';
  h2h: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
  };
}

export const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playClick } = useSound();
  const { createRoom, sendFriendRequestNotification, createChallengeRoom } = useSocket();

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  // Live database user search debounced
  useEffect(() => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      const token = localStorage.getItem('nexus_token');
      fetch(`/api/users/search?q=${encodeURIComponent(searchUsername.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.users || []);
        })
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchUsername]);

  const fetchFriends = () => {
    const token = localStorage.getItem('nexus_token');
    fetch('/api/friends', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setFriends(data.friends || []))
      .catch(() => {});
  };

  const handleSendFriendRequest = async (targetName: string) => {
    playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('nexus_token');
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUsername: targetName })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send friend request');

      sendFriendRequestNotification(targetName);
      setSuccessMsg(`Friend request sent to ${targetName}!`);
      setSearchUsername('');
      setSearchResults([]);
      fetchFriends();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending request');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleAcceptFriendRequest = async (friendId: string) => {
    playClick();
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });
      fetchFriends();
      setSuccessMsg('Friend request accepted!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (friendId: string) => {
    playClick();
    try {
      const token = localStorage.getItem('nexus_token');
      await fetch('/api/friends/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ friendId })
      });
      fetchFriends();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChallenge = (friend: { id: string; username: string }) => {
    playClick();
    setChallengeTarget({ id: friend.id, username: friend.username });
  };

  const executeChallenge = (gameSlug: 'tic-tac-toe' | 'rock-paper-scissors') => {
    if (!challengeTarget) return;
    playClick();
    createChallengeRoom(challengeTarget.id, challengeTarget.username, gameSlug);
    setChallengeTarget(null);
    if (gameSlug === 'tic-tac-toe') {
      navigate('/game/tic-tac-toe');
    } else {
      navigate('/game/rock-paper-scissors');
    }
  };

  const confirmedFriends = friends.filter(f => !f.isPending);
  const pendingRequests = friends.filter(f => f.isPending);

  return (
    <div id="friends-page" className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Social Roster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-white">FRIENDS NETWORK</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Search for players, compare 1v1 Head-to-Head records, send friend requests, and challenge friends to live duels!
            </p>
          </div>

          {/* Add / Search Friend Form with Autocomplete */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchUsername}
                onChange={e => {
                  setSearchUsername(e.target.value);
                  if (activeTab !== 'search' && e.target.value.trim()) {
                    setActiveTab('search');
                  }
                }}
                placeholder="Search player username..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5" />
              )}
            </div>

            {/* Live Autocomplete Suggestions Box */}
            {searchUsername.trim() !== '' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1 font-mono">
                <div className="text-[10px] text-slate-400 font-bold px-3 py-1 flex items-center justify-between border-b border-slate-800/80">
                  <span>DATABASE SUGGESTIONS</span>
                  <span>{searchResults.length} FOUND</span>
                </div>

                {searchResults.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No players found matching "{searchUsername}".
                  </div>
                ) : (
                  searchResults.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-800/60 rounded-xl transition-all gap-2"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img src={s.avatar} alt={s.username} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{s.username}</p>
                          <p className="text-[10px] text-amber-400 flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5" /> {s.rating} ELO
                          </p>
                        </div>
                      </div>

                      {s.friendshipStatus === 'friend' ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold">
                          FRIENDS
                        </span>
                      ) : s.friendshipStatus === 'pending_sent' ? (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold">
                          PENDING
                        </span>
                      ) : s.friendshipStatus === 'pending_received' ? (
                        <button
                          onClick={() => handleAcceptFriendRequest(s.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> ACCEPT
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(s.username)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> ADD
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl font-mono text-xs text-center animate-in fade-in flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-mono text-xs text-center animate-in fade-in flex items-center justify-center gap-2">
            <X className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs overflow-x-auto">
          <button
            onClick={() => { playClick(); setActiveTab('friends'); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'friends' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>MY FRIENDS ({confirmedFriends.length})</span>
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('requests'); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>REQUESTS ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </button>
          <button
            onClick={() => { playClick(); setActiveTab('search'); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'search' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>FIND PLAYERS</span>
          </button>
        </div>

        {/* Tab 1: Friends List */}
        {activeTab === 'friends' && (
          <div>
            {confirmedFriends.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-xs font-mono text-slate-500 space-y-3">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p>You haven't added any friends yet.</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  SEARCH PLAYERS
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {confirmedFriends.map(f => (
                  <div
                    key={f.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={f.avatar}
                            alt={f.username}
                            className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                          />
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">{f.username}</h4>
                          <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-500" />
                            {f.rating} ELO
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRejectRequest(f.id)}
                        title="Remove Friend"
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Head-to-Head Stats Banner */}
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                        <Swords className="w-3.5 h-3.5 text-cyan-400" />
                        <span>H2H RECORD</span>
                      </div>

                      <div className="font-bold text-white">
                        <span className="text-emerald-400">{f.h2h?.wins || 0}W</span>
                        <span className="text-slate-600 mx-1">-</span>
                        <span className="text-rose-400">{f.h2h?.losses || 0}L</span>
                        <span className="text-slate-600 mx-1">-</span>
                        <span className="text-amber-400">{f.h2h?.draws || 0}D</span>
                        <span className="text-[10px] text-slate-500 ml-2">({f.h2h?.winRate || 0}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleChallenge(f)}
                        className="w-full py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Gamepad2 className="w-4 h-4" />
                        <span>CHALLENGE 1v1</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-3 font-mono">
            {pendingRequests.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                No pending friend requests.
              </div>
            ) : (
              pendingRequests.map(r => (
                <div
                  key={r.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt={r.username} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover" />
                    <div>
                      <p className="text-sm font-bold text-white">{r.username}</p>
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {r.rating} ELO
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptFriendRequest(r.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md"
                    >
                      <Check className="w-4 h-4" />
                      <span>ACCEPT</span>
                    </button>
                    <button
                      onClick={() => handleRejectRequest(r.id)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Search Players */}
        {activeTab === 'search' && (
          <div className="space-y-4 font-mono">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> COMMUNITY PLAYERS DATABASE
              </h3>
              <p className="text-xs text-slate-400">
                Type in the search box above to find any competitive player, or select from community leaders below to add them to your roster.
              </p>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                Type a name in the search bar above to see database suggestions!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {searchResults.map(s => (
                  <div
                    key={s.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img src={s.avatar} alt={s.username} className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover" />
                      <div className="truncate">
                        <p className="text-sm font-bold text-white truncate">{s.username}</p>
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {s.rating} ELO
                        </p>
                      </div>
                    </div>

                    {s.friendshipStatus === 'friend' ? (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold whitespace-nowrap">
                        FRIENDS
                      </span>
                    ) : s.friendshipStatus === 'pending_sent' ? (
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold whitespace-nowrap">
                        PENDING
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendFriendRequest(s.username)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>ADD FRIEND</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Challenge Game Selection Modal */}
      {challengeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-mono">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Swords className="w-5 h-5 text-cyan-400" /> CHALLENGE {challengeTarget.username.toUpperCase()}
              </h3>
              <button onClick={() => setChallengeTarget(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select the game title for this 1v1 duel. An instant real-time invitation will be sent to <span className="text-cyan-400 font-bold">{challengeTarget.username}</span>!
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => executeChallenge('tic-tac-toe')}
                className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500 text-center space-y-2 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 group-hover:scale-110 transition-transform">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">Tic-Tac-Toe</p>
                <p className="text-[10px] text-slate-500">Classic 3x3 Grid</p>
              </button>

              <button
                onClick={() => executeChallenge('rock-paper-scissors')}
                className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500 text-center space-y-2 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition-transform">
                  <Swords className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300">Rock-Paper-Scissors</p>
                <p className="text-[10px] text-slate-500">Best of 3 Rounds</p>
              </button>
            </div>

            <button
              onClick={() => setChallengeTarget(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
