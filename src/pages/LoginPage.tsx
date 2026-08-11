import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { Gamepad2, LogIn, Sparkles, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, playAnonymously } = useAuth();
  const { playClick } = useSound();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(identifier.trim());
      navigate('/lobby');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoName: string) => {
    playClick();
    setIsLoading(true);
    try {
      await login(demoName);
      navigate('/lobby');
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-page" className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 mx-auto">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black font-mono text-white">WELCOME BACK</h1>
          <p className="text-xs text-slate-400 font-mono">Sign in to your Hunter's Arena account</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase">Username or Email</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. ApexPredator or user@nexus.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-bold uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-mono text-xs font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-600/20"
          >
            {isLoading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
        </form>

        {/* Anonymous Play Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Don't want to log in?</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
              Play anonymously as a Guest without creating an account or logging in.
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
              PLAY ANONYMOUSLY 👻
            </button>
          </div>
        </div>

        {/* Quick Pro Login Options */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-center font-mono text-xs">
          <p className="text-slate-500 text-[11px] uppercase">Instant Demo Pro Accounts</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleQuickDemo('ApexPredator')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-[11px] font-bold"
            >
              ApexPredator (1542 ELO)
            </button>
            <button
              onClick={() => handleQuickDemo('ShadowX')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-[11px] font-bold"
            >
              ShadowX (1498 ELO)
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:underline font-bold">
            Sign Up
          </Link>
        </p>

      </div>
    </div>
  );
};
