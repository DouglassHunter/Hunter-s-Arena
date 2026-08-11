import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { Settings, Volume2, VolumeX, User, Check, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { soundEnabled, toggleSound, playClick } = useSound();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(user?.username || 'Player');
  const [successMsg, setSuccessMsg] = useState(false);

  const AVATAR_SEEDS = ['ApexPredator', 'ShadowX', 'CyberHunter', 'VortexQueen', 'NovaStrike', 'NeonSamurai', 'CosmicRider', 'PixelMaster'];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClick();
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedAvatarSeed)}`;
    updateProfile({
      username: username.trim(),
      bio: bio.trim(),
      avatar: avatarUrl
    });
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div id="settings-page" className="min-h-screen bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </div>
            <h1 className="text-2xl font-black font-mono text-white">PLATFORM SETTINGS</h1>
            <p className="text-xs text-slate-400 mt-1">Configure audio synthesizer, avatar customization, and profile bio.</p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs rounded-xl text-center">
            Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
          
          {/* Audio Settings Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-cyan-400" /> Sound Effects & Audio Synthesizer
            </h3>
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs font-bold text-slate-200">Web Audio Sound Effects</p>
                <p className="text-[11px] text-slate-500">Play synthesize tones on clicks, moves, round starts, victory, defeat, and draw.</p>
              </div>
              <button
                type="button"
                onClick={() => { toggleSound(); playClick(); }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${
                  soundEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'ENABLED' : 'MUTED'}</span>
              </button>
            </div>
          </div>

          {/* Avatar Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Avatar Preset Selection
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
              {AVATAR_SEEDS.map(seed => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
                const isSelected = selectedAvatarSeed === seed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => { playClick(); setSelectedAvatarSeed(seed); }}
                    className={`p-1.5 rounded-xl border transition-all ${
                      isSelected ? 'bg-indigo-600/30 border-indigo-500 scale-105' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={url} alt={seed} className="w-10 h-10 rounded-lg object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile Fields */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Profile Customization</h3>
            <div className="space-y-2">
              <label className="text-slate-400 font-bold uppercase">Display Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 font-bold uppercase">Gamer Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg uppercase tracking-wider"
            >
              SAVE SETTINGS
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
