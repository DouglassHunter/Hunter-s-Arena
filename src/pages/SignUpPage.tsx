import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { Gamepad2, UserPlus, UserCheck } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, playAnonymously } = useAuth();
  const { playClick } = useSound();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) return;
    playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await signUp(username.trim(), email.trim());
      navigate('/lobby');
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="signup-page" className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black font-mono text-white">JOIN THE ARENA</h1>
          <p className="text-xs text-slate-400 font-mono">Create your competitive profile on Hunter's Arena</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. CyberKnight"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-mono text-xs font-bold rounded-xl uppercase tracking-wider shadow-lg"
          >
            {isLoading ? 'CREATING PROFILE...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Anonymous Play Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Don't want to create a profile?</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Skip registration and jump straight into games with a temporary Guest account.
            </p>
            <button
              type="button"
              onClick={async () => {
                playClick();
                await playAnonymously();
                navigate('/lobby');
              }}
              className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
            >
              PLAY ANONYMOUSLY ⚡
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline font-bold">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
};
