import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import { SoundProvider } from './context/SoundContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { NotificationOverlay } from './components/NotificationOverlay.js';

import { LandingPage } from './pages/LandingPage.js';
import { LobbyPage } from './pages/LobbyPage.js';
import { TicTacToePage } from './pages/TicTacToePage.js';
import { RPSPage } from './pages/RPSPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { MatchHistoryPage } from './pages/MatchHistoryPage.js';
import { FriendsPage } from './pages/FriendsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignUpPage } from './pages/SignUpPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <SoundProvider>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white max-w-full overflow-x-hidden">
              <Navbar />
              <NotificationOverlay />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/lobby" element={<LobbyPage />} />
                  <Route path="/game/tic-tac-toe" element={<TicTacToePage />} />
                  <Route path="/game/rock-paper-scissors" element={<RPSPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/history" element={<MatchHistoryPage />} />
                  <Route path="/friends" element={<FriendsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </SoundProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
