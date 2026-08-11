import { Request, Response } from 'express';
import { getUserById, getUserByEmail, getUserByUsername, saveUser } from './store.js';
import { UserProfile } from '../src/types/index.js';

export function handleSignUp(req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required.' });
  }

  if (getUserByEmail(email)) {
    return res.status(400).json({ error: 'Email already registered.' });
  }

  if (getUserByUsername(username)) {
    return res.status(400).json({ error: 'Username already taken.' });
  }

  const newId = `usr-${Date.now()}`;
  const newUser: UserProfile = {
    id: newId,
    username: username.trim(),
    email: email.trim(),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    bio: 'Ready to compete on NEXUS ARENA',
    rating: 1000,
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    joinedAt: new Date().toISOString().split('T')[0],
    soundEnabled: true,
    gameStats: {
      'tic-tac-toe': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 },
      'rock-paper-scissors': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 }
    }
  };

  saveUser(newUser);

  return res.json({
    token: `token-${newUser.id}`,
    user: newUser
  });
}

export function handleLogin(req: Request, res: Response) {
  const { email, username } = req.body;

  let user: UserProfile | undefined;
  if (email) user = getUserByEmail(email);
  if (!user && username) user = getUserByUsername(username);

  // If no user found, auto-create guest/demo login so testing is effortless
  if (!user) {
    const identifier = username || email || `Player${Math.floor(Math.random() * 8999 + 1000)}`;
    const newId = `usr-${Date.now()}`;
    user = {
      id: newId,
      username: identifier.trim(),
      email: `${identifier.toLowerCase()}@nexus.com`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(identifier)}`,
      bio: 'New challenger on NEXUS ARENA',
      rating: 1000,
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
      bestStreak: 0,
      joinedAt: new Date().toISOString().split('T')[0],
      soundEnabled: true,
      gameStats: {
        'tic-tac-toe': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 },
        'rock-paper-scissors': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 }
      }
    };
    saveUser(user);
  }

  return res.json({
    token: `token-${user.id}`,
    user
  });
}

export function handleGetMe(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header.' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ user });
}

export function handleUpdateProfile(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const userId = authHeader.replace('Bearer ', '').replace('token-', '');
  const user = getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { username, avatar, bio, soundEnabled } = req.body;
  if (username && username.trim() !== '') {
    const trimmed = username.trim();
    if (trimmed.toLowerCase() !== user.username.toLowerCase()) {
      const existing = getUserByUsername(trimmed);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ error: `The name "${trimmed}" is already taken in the database. Please choose a different name.` });
      }
    }
    user.username = trimmed;
  }
  if (avatar) user.avatar = avatar;
  if (bio !== undefined) user.bio = bio;
  if (soundEnabled !== undefined) user.soundEnabled = soundEnabled;

  saveUser(user);
  return res.json({ user });
}
