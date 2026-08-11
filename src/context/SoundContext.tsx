import React, { createContext, useContext, useState, useEffect } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClick: () => void;
  playMove: () => void;
  playCountdown: () => void;
  playRoundStart: () => void;
  playVictory: () => void;
  playDefeat: () => void;
  playDraw: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_sound');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('nexus_sound', JSON.stringify(next));
      return next;
    });
  };

  // Helper using Web Audio API synthesizer
  const playTone = (freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext might be blocked until user gesture
    }
  };

  const playClick = () => playTone(600, 'sine', 0.08, 0.05);
  const playMove = () => playTone(800, 'triangle', 0.12, 0.1);
  const playCountdown = () => playTone(440, 'sine', 0.15, 0.08);
  const playRoundStart = () => {
    playTone(523.25, 'sine', 0.1, 0.08);
    setTimeout(() => playTone(659.25, 'sine', 0.15, 0.1), 100);
  };

  const playVictory = () => {
    if (!soundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, idx) => {
      setTimeout(() => playTone(note, 'triangle', 0.3, 0.12), idx * 120);
    });
  };

  const playDefeat = () => {
    if (!soundEnabled) return;
    const notes = [400, 350, 300, 250];
    notes.forEach((note, idx) => {
      setTimeout(() => playTone(note, 'sawtooth', 0.25, 0.08), idx * 150);
    });
  };

  const playDraw = () => {
    if (!soundEnabled) return;
    playTone(400, 'sine', 0.2, 0.08);
    setTimeout(() => playTone(400, 'sine', 0.3, 0.08), 220);
  };

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playClick,
        playMove,
        playCountdown,
        playRoundStart,
        playVictory,
        playDefeat,
        playDraw
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider');
  return context;
};
