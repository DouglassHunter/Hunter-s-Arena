import { Request, Response } from 'express';
import {
  GAMES_CATALOG,
  getLeaderboard,
  matchesStore,
  getUserById,
  roomsStore,
  getFriendsWithH2H,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} from './store.js';

export function handleGetGames(req: Request, res: Response) {
  // Enrich game catalog with live room counts & active players
  const rooms = Array.from(roomsStore.values());

  const enrichedGames = GAMES_CATALOG.map(game => {
    const activeRooms = rooms.filter(r => r.gameSlug === game.slug);
    const activePlayers = activeRooms.reduce((acc, r) => acc + r.currentPlayers, 0);

    return {
      ...game,
      activeRooms: activeRooms.length,
      activePlayers: Math.max(activePlayers, Math.floor(Math.random() * 8 + 4)) // Baseline active visual count
    };
  });

  return res.json({ games: enrichedGames });
}

export function handleGetLeaderboard(req: Request, res: Response) {
  const game = req.query.game as string | undefined;
  const timeframe = req.query.timeframe as string | undefined;

  const leaderboard = getLeaderboard(game, timeframe);
  return res.json({ leaderboard });
}

export function handleGetMatches(req: Request, res: Response) {
  const userId = req.query.userId as string | undefined;
  let matches = [...matchesStore];

  if (userId) {
    matches = matches.filter(m => m.player1.id === userId || m.player2.id === userId);
  }

  return res.json({ matches: matches.slice(0, 30) });
}

export function handleGetFriends(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const userId = authHeader.replace('Bearer ', '').replace('token-', '');
  const friendsList = getFriendsWithH2H(userId);

  return res.json({ friends: friendsList });
}

export function handleSearchUsers(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserId = authHeader.replace('Bearer ', '').replace('token-', '');
  const query = (req.query.q as string) || '';

  const results = searchUsers(query, currentUserId);
  return res.json({ users: results });
}

export function handleSendFriendRequest(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserId = authHeader.replace('Bearer ', '').replace('token-', '');
  const { targetUsername } = req.body;

  if (!targetUsername) return res.status(400).json({ error: 'Target username required' });

  try {
    const result = sendFriendRequest(currentUserId, targetUsername);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to send friend request' });
  }
}

export function handleAcceptFriendRequest(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserId = authHeader.replace('Bearer ', '').replace('token-', '');
  const { friendId } = req.body;

  if (!friendId) return res.status(400).json({ error: 'Friend ID required' });

  const success = acceptFriendRequest(currentUserId, friendId);
  return res.json({ success });
}

export function handleRejectFriendRequest(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserId = authHeader.replace('Bearer ', '').replace('token-', '');
  const { friendId } = req.body;

  if (!friendId) return res.status(400).json({ error: 'Friend ID required' });

  const success = rejectFriendRequest(currentUserId, friendId);
  return res.json({ success });
}

export function handleGetPublicRooms(req: Request, res: Response) {
  const game = req.query.game as string | undefined;
  let rooms = Array.from(roomsStore.values()).filter(r => !r.isPrivate && r.status === 'waiting');

  if (game && game !== 'all') {
    rooms = rooms.filter(r => r.gameSlug === game);
  }

  return res.json({ rooms });
}

