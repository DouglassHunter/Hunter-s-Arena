import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSound } from '../context/SoundContext.js';
import { ConnectionStatus } from './ConnectionStatus.js';
import { Gamepad2, Trophy, Users, User, Volume2, VolumeX, Flame, Settings, LogOut, Menu, X, History } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { soundEnabled, toggleSound, playClick } = useSound();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Gamepad2 },
    { name: 'Lobby', path: '/lobby', icon: Gamepad2 },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Match History', path: '/history', icon: History },
    { name: 'Friends', path: '/friends', icon: Users },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  return (
    <header id="app-navbar" className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" onClick={playClick} className="flex items-center gap-2 lg:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white flex items-center gap-1 font-mono">
              HUNTER'S<span className="text-cyan-400">ARENA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-slate-400 -mt-1 hidden lg:block">
              Multiplayer Platform
            </span>
          </div>
        </Link>

        {/* Desktop / Tablet Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={playClick}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2 lg:px-3 py-1.5 rounded-lg text-[11px] lg:text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>{item.name === 'Match History' ? 'History' : item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          
          <ConnectionStatus />

          {/* Audio Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              toggleSound();
              playClick();
            }}
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="hidden md:flex p-1.5 lg:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-slate-500" />}
          </button>

          {/* User Profile Bar */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800">
              <Link
                to="/profile"
                onClick={playClick}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-900/80 transition-colors group"
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-800 border border-slate-700/80 object-cover shadow-sm group-hover:border-indigo-500 transition-colors"
                />
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-[100px]">
                    {user.username}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400">
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500/30" />
                    <span>{user.rating} ELO</span>
                  </div>
                </div>
              </Link>

              <Link
                to="/settings"
                onClick={playClick}
                title="Settings"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                id="logout-btn"
                onClick={() => {
                  playClick();
                  logout();
                }}
                title="Logout"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                to="/login"
                onClick={playClick}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                Log In
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800/90 shadow-2xl px-4 py-4 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  playClick();
                  setMobileMenuOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-400 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Sound Toggle in Mobile Dropdown */}
          <button
            onClick={() => {
              toggleSound();
              playClick();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 transition-colors border-t border-slate-900/80 pt-3"
          >
            <div className="flex items-center gap-3">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>Sound Effects</span>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${soundEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
              {soundEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
          
          {user ? (
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between px-2">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs font-medium text-rose-400 hover:text-rose-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-900">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
