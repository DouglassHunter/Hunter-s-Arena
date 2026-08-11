import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import { handleSignUp, handleLogin, handleGetMe, handleUpdateProfile } from './server/auth.js';
import {
  handleGetGames,
  handleGetLeaderboard,
  handleGetMatches,
  handleGetFriends,
  handleGetPublicRooms,
  handleSearchUsers,
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest
} from './server/api.ts';
import { setupSocketIO } from './server/socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Socket.IO Setup
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  setupSocketIO(io);

  // Authentication API Routes
  app.post('/api/auth/signup', handleSignUp);
  app.post('/api/auth/login', handleLogin);
  app.get('/api/auth/me', handleGetMe);
  app.post('/api/auth/profile', handleUpdateProfile);

  // Game & Social API Routes
  app.get('/api/games', handleGetGames);
  app.get('/api/leaderboard', handleGetLeaderboard);
  app.get('/api/matches', handleGetMatches);
  app.get('/api/friends', handleGetFriends);
  app.get('/api/users/search', handleSearchUsers);
  app.post('/api/friends/request', handleSendFriendRequest);
  app.post('/api/friends/accept', handleAcceptFriendRequest);
  app.post('/api/friends/reject', handleRejectFriendRequest);
  app.get('/api/rooms', handleGetPublicRooms);

  // Development vs Production setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXUS ARENA] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
