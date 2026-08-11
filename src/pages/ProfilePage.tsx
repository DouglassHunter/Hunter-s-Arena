import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { MatchHistoryItem } from '../types/index.js';
import {
  User,
  Flame,
  Trophy,
  Calendar,
  Grid3X3,
  HandMetal,
  Award,
  History,
  Edit3,
  Check,
  Swords,
  Users,
  UserCheck,
  X,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

interface FriendH2HItem {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  h2h: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
  };
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=ApexPredator',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowX',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberHunter',
  'https://api.dicebear.com/7.x/bottts/svg?seed=NeonViper',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PulseRider',
  'https://api.dicebear.com/7.x/bottts/svg?seed=PhantomX',
  'https://api.dicebear.com/7.x/bottts/svg?seed=MechMaster',
  'https://api.dicebear.com/7.x/bottts/svg?seed=AuraMaster'
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refreshProfile, playAnonymously } = useAuth();
  const { playClick } = useSound();

  const [activeTab, setActiveTab] = useState<'overall' | 'tic-tac-toe' | 'rock-paper-scissors'>('overall');
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [friendsH2H, setFriendsH2H] = useState<FriendH2HItem[]>([]);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [customAvatarSeed, setCustomAvatarSeed] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setBioInput(user.bio || '');
      fetch(`/api/matches?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setMatches(data.matches || []))
        .catch(() => {});

      const token = localStorage.getItem('nexus_token');
      if (token) {
        fetch('/api/friends', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setFriendsH2H(data.friends || []))
          .catch(() => {});
      }
    }
  }, [user?.id]);

  const handleOpenEditModal = () => {
    playClick();
    if (user) {
      setEditUsername(user.username);
      setEditAvatar(user.avatar);
      setCustomAvatarSeed('');
      setProfileError(null);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    playClick();
    if (!editUsername.trim()) {
      setProfileError('Username cannot be empty.');
      return;
    }
    setIsSaving(true);
    setProfileError(null);

    try {
      await updateProfile({
        username: editUsername.trim(),
        avatar: editAvatar
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBio = async () => {
    playClick();
    try {
      await updateProfile({ bio: bioInput });
      setIsEditingBio(false);
    } catch (err: any) {
      console.error('Failed to update bio:', err);
    }
  };

  // If user is logged out / anonymous
  if (!user) {
    return (
      <div id="player-profile-page" className="min-h-screen bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Anonymous Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/30 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black font-mono text-white">LOGGED OUT SESSION</h1>
              <p className="text-xs text-slate-400 font-mono max-w-lg mx-auto leading-relaxed">
                You are currently browsing without a logged-in profile. You can jump directly into games as an Anonymous Guest or sign in to save stats and track global leaderboard ranks.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs font-bold">
              <button
                onClick={async () => {
                  playClick();
                  await playAnonymously();
                  navigate('/lobby');
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all"
              >
                PLAY ANONYMOUSLY 👻
              </button>

              <Link
                to="/login"
                onClick={playClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-center transition-all"
              >
                LOG IN TO ACCOUNT
              </Link>

              <Link
                to="/signup"
                onClick={playClick}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center shadow-lg shadow-indigo-600/20 transition-all"
              >
                CREATE PROFILE
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  }

  const winRate = user.totalGames > 0 ? Math.round((user.wins / user.totalGames) * 100) : 0;
  const tttStats = user.gameStats?.['tic-tac-toe'] || { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 };
  const rpsStats = user.gameStats?.['rock-paper-scissors'] || { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 };

  const tttWinRate = tttStats.totalGames > 0 ? Math.round((tttStats.wins / tttStats.totalGames) * 100) : 0;
  const rpsWinRate = rpsStats.totalGames > 0 ? Math.round((rpsStats.wins / rpsStats.totalGames) * 100) : 0;

  return (
    <div id="player-profile-page" className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Info Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            
            {/* Avatar */}
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-800 border-2 border-indigo-500/80 object-cover shadow-xl"
              />
            </div>

            {/* User Meta */}
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-3xl font-black font-mono text-white tracking-tight">{user.username}</h1>
                  <button
                    onClick={handleOpenEditModal}
                    title="Edit Name & Profile Pic"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={handleOpenEditModal}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Profile</span>
                  </button>

                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    {user.rating} ELO
                  </span>
                </div>
              </div>

              {/* Bio */}
              {isEditingBio ? (
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleSaveBio}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2 group">
                  <p className="text-xs text-slate-300 font-mono italic">{user.bio || 'No bio set.'}</p>
                  <button
                    onClick={() => {
                      playClick();
                      setIsEditingBio(true);
                    }}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Joined {user.joinedAt}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Best Streak: {user.bestStreak}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Statistics Tabs */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 font-mono text-xs overflow-x-auto whitespace-nowrap max-w-full">
            <button
              onClick={() => {
                playClick();
                setActiveTab('overall');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'overall' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              OVERALL STATS
            </button>
            <button
              onClick={() => {
                playClick();
                setActiveTab('tic-tac-toe');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'tic-tac-toe' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              TIC-TAC-TOE
            </button>
            <button
              onClick={() => {
                playClick();
                setActiveTab('rock-paper-scissors');
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'rock-paper-scissors' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              ROCK-PAPER-SCISSORS
            </button>
          </div>

          {/* Stats Cards Display */}
          {activeTab === 'overall' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Total Matches</p>
                <p className="text-3xl font-extrabold text-white">{user.totalGames}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Victories</p>
                <p className="text-3xl font-extrabold text-emerald-400">{user.wins}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Defeats / Draws</p>
                <p className="text-3xl font-extrabold text-rose-400">{user.losses} <span className="text-xs font-normal text-slate-500">/ {user.draws}</span></p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Win Rate</p>
                <p className="text-3xl font-extrabold text-cyan-400">{winRate}%</p>
              </div>
            </div>
          )}

          {activeTab === 'tic-tac-toe' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">TTT Matches</p>
                <p className="text-3xl font-extrabold text-white">{tttStats.totalGames}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Wins</p>
                <p className="text-3xl font-extrabold text-emerald-400">{tttStats.wins}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Losses / Draws</p>
                <p className="text-3xl font-extrabold text-rose-400">{tttStats.losses} <span className="text-xs font-normal text-slate-500">/ {tttStats.draws}</span></p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Win Rate</p>
                <p className="text-3xl font-extrabold text-cyan-400">{tttWinRate}%</p>
              </div>
            </div>
          )}

          {activeTab === 'rock-paper-scissors' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">RPS Matches</p>
                <p className="text-3xl font-extrabold text-white">{rpsStats.totalGames}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Wins</p>
                <p className="text-3xl font-extrabold text-emerald-400">{rpsStats.wins}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Losses / Draws</p>
                <p className="text-3xl font-extrabold text-rose-400">{rpsStats.losses} <span className="text-xs font-normal text-slate-500">/ {rpsStats.draws}</span></p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Win Rate</p>
                <p className="text-3xl font-extrabold text-cyan-400">{rpsWinRate}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Head-to-Head vs Friends Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <Swords className="w-5 h-5 text-cyan-400" /> HEAD-TO-HEAD VS FRIENDS
            </h3>
          </div>

          {friendsH2H.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs font-mono text-slate-500">
              No friends added yet. Add friends on the Friends page to track 1v1 Head-to-Head stats!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
              {friendsH2H.map(f => (
                <div
                  key={f.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={f.avatar}
                      alt={f.username}
                      className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{f.username}</p>
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" /> {f.rating} ELO
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 inline-block">
                      <span className="text-emerald-400">{f.h2h.wins}W</span>
                      <span className="text-slate-500 mx-1">-</span>
                      <span className="text-rose-400">{f.h2h.losses}L</span>
                      <span className="text-slate-500 mx-1">-</span>
                      <span className="text-amber-400">{f.h2h.draws}D</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {f.h2h.totalMatches > 0 ? `${f.h2h.winRate}% Win Rate` : 'No matches yet'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Match History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" /> RECENT MATCH HISTORY
            </h3>
          </div>

          {matches.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-xs font-mono text-slate-500">
              No recent matches logged yet. Play a game in the lobby to record match statistics!
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              {matches.slice(0, 10).map(m => {
                const isWon = m.winnerId === user.id;
                const isDraw = m.winnerId === null;
                const opponent = m.player1.id === user.id ? m.player2 : m.player1;
                const ratingChange = m.ratingChanges?.[user.id] || 0;

                return (
                  <div
                    key={m.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                        isWon
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : isDraw
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isWon ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                      </span>

                      <div>
                        <p className="text-sm font-bold text-white">{m.gameName}</p>
                        <p className="text-xs text-slate-400">vs {opponent.username}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-200">{m.scoreText}</p>
                      <p className={`text-xs font-bold ${ratingChange > 0 ? 'text-emerald-400' : ratingChange < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {ratingChange > 0 ? `+${ratingChange}` : ratingChange} ELO
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <Edit3 className="w-5 h-5" />
                <span className="text-base text-white">Edit Profile</span>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message / Duplicate Name Alert Prompt */}
            {profileError && (
              <div className="p-4 bg-rose-500/10 border-2 border-rose-500/50 rounded-2xl text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-xs uppercase">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Name Already Taken</span>
                </div>
                <p className="text-xs leading-relaxed text-rose-200">{profileError}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-slate-300 font-bold uppercase tracking-wider block">Username / Display Name</label>
              <input
                type="text"
                value={editUsername}
                onChange={e => {
                  setEditUsername(e.target.value);
                  setProfileError(null);
                }}
                placeholder="Enter new username..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Avatar Selection */}
            <div className="space-y-3">
              <label className="text-slate-300 font-bold uppercase tracking-wider block">Choose Profile Picture</label>
              
              {/* Live Preview & Presets */}
              <div className="flex items-center gap-4 p-3 bg-slate-950 border border-slate-800/80 rounded-2xl">
                <img
                  src={editAvatar}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-xl bg-slate-900 border-2 border-indigo-500 object-cover flex-shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-slate-300 font-bold text-xs">Avatar Preview</span>
                  <p className="text-[11px] text-slate-500">Select a preset avatar below!</p>
                </div>
              </div>

              {/* Preset Avatar Grid */}
              <div className="space-y-1.5">
                <span className="text-slate-400 text-[11px] uppercase font-semibold">Preset Avatars</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playClick();
                        setEditAvatar(preset);
                      }}
                      className={`p-1 rounded-xl bg-slate-950 border transition-all ${
                        editAvatar === preset
                          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="w-10 h-10 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveProfile}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
