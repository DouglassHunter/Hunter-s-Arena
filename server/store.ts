import { UserProfile, GameDefinition, GameRoom, MatchHistoryItem, LeaderboardEntry } from '../src/types/index.js';
export type { UserProfile } from '../src/types/index.js';
import { calculateEloChange } from './elo.js';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'arena_data.json');

// Pre-seeded games
export const GAMES_CATALOG: GameDefinition[] = [
  {
    id: 'game-1',
    name: 'Tic-Tac-Toe',
    slug: 'tic-tac-toe',
    description: 'Classic 3x3 strategic line match. Outsmart your opponent with calculated moves.',
    icon: 'Grid3X3',
    minPlayers: 2,
    maxPlayers: 2,
    active: true,
    category: 'Tactical',
    badge: 'Popular',
    rules: [
      '3x3 grid board',
      'Player 1 is X, Player 2 is O',
      'Take turns placing your mark on an empty cell',
      'Get 3 in a row horizontally, vertically, or diagonally to win'
    ]
  },
  {
    id: 'game-2',
    name: 'Rock-Paper-Scissors',
    slug: 'rock-paper-scissors',
    description: 'Competitive Best-of-5 duel. Lock in choices simultaneously without peeking.',
    icon: 'HandMetal',
    minPlayers: 2,
    maxPlayers: 2,
    active: true,
    category: 'Mind Games',
    badge: 'Fast-Paced',
    rules: [
      'Best-of-5 rounds match format',
      'Both players submit choices simultaneously',
      'Rock beats Scissors, Scissors beats Paper, Paper beats Rock',
      'First player to reach 3 round victories wins the match'
    ]
  }
];

// Initial community users (clean system bot only)
let usersStore: Map<string, UserProfile> = new Map([
  ['usr-bot', {
    id: 'usr-bot',
    username: "Hunter's Bot 🤖",
    email: 'bot@huntersarena.com',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HuntersBot',
    bio: "AI Practice Bot for Hunter's Arena. Always ready for a match!",
    rating: 1200,
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    joinedAt: '2026-08-11',
    soundEnabled: false,
    gameStats: {
      'tic-tac-toe': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 },
      'rock-paper-scissors': { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 }
    }
  }]
]);

// Active game rooms map: roomCode -> GameRoom
export const roomsStore = new Map<string, GameRoom>();

// Match history log
export const matchesStore: MatchHistoryItem[] = [];

// Friends relations
export interface FriendRecord {
  userId: string;
  friendId: string;
  status: 'accepted' | 'pending';
  initiatedBy: string;
}

export const friendsStore: FriendRecord[] = [];

export function saveDataToDisk() {
  try {
    const payload = {
      users: Array.from(usersStore.values()),
      friends: friendsStore,
      matches: matchesStore
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save arena data to disk:', err);
  }
}

export function loadDataFromDisk() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (data.users && Array.isArray(data.users)) {
        data.users.forEach((u: UserProfile) => {
          usersStore.set(u.id, u);
        });
      }
      if (data.friends && Array.isArray(data.friends)) {
        friendsStore.length = 0;
        friendsStore.push(...data.friends);
      }
      if (data.matches && Array.isArray(data.matches)) {
        matchesStore.length = 0;
        matchesStore.push(...data.matches);
      }
    }
  } catch (err) {
    console.error('Failed to load arena data from disk:', err);
  }
}

// Perform initial load if file exists
loadDataFromDisk();

// Helper methods
export function getUserById(id: string): UserProfile | undefined {
  return usersStore.get(id);
}

export function getUserByEmail(email: string): UserProfile | undefined {
  for (const u of usersStore.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) return u;
  }
  return undefined;
}

export function getUserByUsername(username: string): UserProfile | undefined {
  for (const u of usersStore.values()) {
    if (u.username.toLowerCase() === username.toLowerCase()) return u;
  }
  return undefined;
}

export function saveUser(user: UserProfile): UserProfile {
  usersStore.set(user.id, user);
  saveDataToDisk();
  return user;
}

export function getLeaderboard(gameFilter?: string, timeframe?: string): LeaderboardEntry[] {
  const usersList = Array.from(usersStore.values()).filter(u => u.id !== 'usr-bot');
  
  usersList.sort((a, b) => b.rating - a.rating);

  return usersList.map((user, index) => {
    let wins = user.wins;
    let losses = user.losses;
    let draws = user.draws;
    let totalGames = user.totalGames;

    if (gameFilter && gameFilter !== 'all' && user.gameStats?.[gameFilter]) {
      const gs = user.gameStats[gameFilter];
      wins = gs.wins;
      losses = gs.losses;
      draws = gs.draws;
      totalGames = gs.totalGames;
    }

    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      rank: index + 1,
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      rating: user.rating,
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      winStreak: user.winStreak
    };
  });
}

export function recordMatchCompletion(
  gameSlug: string,
  p1Id: string,
  p2Id: string,
  winnerId: string | null, // null for draw
  scoreText: string,
  details?: any
) {
  const p1 = getUserById(p1Id);
  const p2 = getUserById(p2Id);
  if (!p1 || !p2) return;

  const game = GAMES_CATALOG.find(g => g.slug === gameSlug);
  const gameName = game ? game.name : gameSlug;

  // Calculate ELO changes
  let p1Outcome: 1 | 0 | 0.5 = 0.5;
  let p2Outcome: 1 | 0 | 0.5 = 0.5;

  if (winnerId === p1Id) {
    p1Outcome = 1;
    p2Outcome = 0;
  } else if (winnerId === p2Id) {
    p1Outcome = 0;
    p2Outcome = 1;
  }

  const p1Change = calculateEloChange(p1.rating, p2.rating, p1Outcome);
  const p2Change = calculateEloChange(p2.rating, p1.rating, p2Outcome);

  p1.rating = Math.max(100, p1.rating + p1Change);
  p2.rating = Math.max(100, p2.rating + p2Change);

  // Update stats
  updateUserStats(p1, gameSlug, winnerId === p1Id, winnerId === null);
  updateUserStats(p2, gameSlug, winnerId === p2Id, winnerId === null);

  saveUser(p1);
  saveUser(p2);

  // Record match history
  const matchRecord: MatchHistoryItem = {
    id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    gameSlug,
    gameName,
    player1: { id: p1.id, username: p1.username, avatar: p1.avatar },
    player2: { id: p2.id, username: p2.username, avatar: p2.avatar },
    winnerId,
    scoreText,
    ratingChanges: { [p1.id]: p1Change, [p2.id]: p2Change },
    date: new Date().toISOString().split('T')[0],
    createdAt: Date.now()
  };

  matchesStore.unshift(matchRecord);

  // Save updated users and matches to persistent disk storage!
  saveUser(p1);
  saveUser(p2);
  saveDataToDisk();

  return { p1Change, p2Change, matchRecord };
}

function updateUserStats(user: UserProfile, gameSlug: string, isWin: boolean, isDraw: boolean) {
  user.totalGames += 1;
  if (isWin) {
    user.wins += 1;
    user.winStreak += 1;
    if (user.winStreak > user.bestStreak) user.bestStreak = user.winStreak;
  } else if (isDraw) {
    user.draws += 1;
    user.winStreak = 0;
  } else {
    user.losses += 1;
    user.winStreak = 0;
  }

  if (!user.gameStats) user.gameStats = {};
  if (!user.gameStats[gameSlug]) {
    user.gameStats[gameSlug] = { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, bestStreak: 0 };
  }

  const gs = user.gameStats[gameSlug];
  gs.totalGames += 1;
  if (isWin) {
    gs.wins += 1;
    gs.winStreak += 1;
    if (gs.winStreak > gs.bestStreak) gs.bestStreak = gs.winStreak;
  } else if (isDraw) {
    gs.draws += 1;
    gs.winStreak = 0;
  } else {
    gs.losses += 1;
    gs.winStreak = 0;
  }
}

export function calculateH2H(user1Id: string, user2Id: string) {
  const directMatches = matchesStore.filter(
    m => (m.player1.id === user1Id && m.player2.id === user2Id) ||
         (m.player1.id === user2Id && m.player2.id === user1Id)
  );

  let wins = 0;
  let losses = 0;
  let draws = 0;

  directMatches.forEach(m => {
    if (m.winnerId === user1Id) wins++;
    else if (m.winnerId === user2Id) losses++;
    else draws++;
  });

  return {
    wins,
    losses,
    draws,
    totalMatches: directMatches.length,
    winRate: directMatches.length > 0 ? Math.round((wins / directMatches.length) * 100) : 0,
    recentMatches: directMatches.slice(0, 5)
  };
}

const onlineUsersSet = new Set<string>();

export function markUserOnline(userId: string) {
  if (userId) onlineUsersSet.add(userId);
}

export function markUserOffline(userId: string) {
  if (userId) onlineUsersSet.delete(userId);
}

export function isUserOnline(userId: string): boolean {
  if (userId === 'usr-bot') return true;
  return onlineUsersSet.has(userId);
}

export function getFriendsWithH2H(userId: string) {
  const userRecords = friendsStore.filter(f => f.userId === userId || f.friendId === userId);

  return userRecords.map(f => {
    const isPrimaryUser = f.userId === userId;
    const friendId = isPrimaryUser ? f.friendId : f.userId;
    const friendUser = getUserById(friendId);
    const h2h = calculateH2H(userId, friendId);

    const online = isUserOnline(friendId);

    return {
      id: friendId,
      username: friendUser ? friendUser.username : 'Unknown',
      avatar: friendUser ? friendUser.avatar : '',
      rating: friendUser ? friendUser.rating : 1000,
      status: (online ? 'online' : 'offline') as 'online' | 'offline' | 'in_game',
      isPending: f.status === 'pending',
      isIncoming: f.status === 'pending' && f.initiatedBy !== userId,
      initiatedBy: f.initiatedBy,
      h2h
    };
  });
}

export function searchUsers(query: string, currentUserId: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = [];
  for (const user of usersStore.values()) {
    if (user.id === currentUserId) continue;
    if (user.username.toLowerCase().includes(q)) {
      // Find friendship relation if any
      const relation = friendsStore.find(
        f => (f.userId === currentUserId && f.friendId === user.id) ||
             (f.userId === user.id && f.friendId === currentUserId)
      );

      let friendshipStatus: 'friend' | 'pending_sent' | 'pending_received' | 'none' = 'none';
      if (relation) {
        if (relation.status === 'accepted') {
          friendshipStatus = 'friend';
        } else if (relation.initiatedBy === currentUserId) {
          friendshipStatus = 'pending_sent';
        } else {
          friendshipStatus = 'pending_received';
        }
      }

      const h2h = calculateH2H(currentUserId, user.id);

      results.push({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        rating: user.rating,
        friendshipStatus,
        h2h
      });
    }
  }

  return results.slice(0, 10);
}

export function sendFriendRequest(currentUserId: string, targetUsername: string) {
  const target = getUserByUsername(targetUsername);
  if (!target) throw new Error('User not found with that username.');
  if (target.id === currentUserId) throw new Error('Cannot send a friend request to yourself.');

  const existingIdx = friendsStore.findIndex(
    f => (f.userId === currentUserId && f.friendId === target.id) ||
         (f.userId === target.id && f.friendId === currentUserId)
  );

  if (existingIdx !== -1) {
    const existing = friendsStore[existingIdx];
    if (existing.status === 'accepted') throw new Error('You are already friends with this player!');
    if (existing.initiatedBy === currentUserId) throw new Error('Friend request already sent!');
    // If pending from target, accept automatically!
    existing.status = 'accepted';
    saveDataToDisk();
    return { status: 'accepted', friend: target };
  }

  friendsStore.push({
    userId: currentUserId,
    friendId: target.id,
    status: 'pending',
    initiatedBy: currentUserId
  });

  saveDataToDisk();
  return { status: 'pending', friend: target };
}

export function acceptFriendRequest(currentUserId: string, friendId: string) {
  const idx = friendsStore.findIndex(
    f => (f.userId === currentUserId && f.friendId === friendId) ||
         (f.userId === friendId && f.friendId === currentUserId)
  );

  if (idx !== -1) {
    const relation = friendsStore[idx];
    if (relation.status === 'pending' && relation.initiatedBy === currentUserId) {
      throw new Error('Only the specified friend (recipient) can accept this request.');
    }
    relation.status = 'accepted';
    saveDataToDisk();
    return true;
  }
  return false;
}

export function rejectFriendRequest(currentUserId: string, friendId: string) {
  const idx = friendsStore.findIndex(
    f => (f.userId === currentUserId && f.friendId === friendId) ||
         (f.userId === friendId && f.friendId === currentUserId)
  );

  if (idx !== -1) {
    const relation = friendsStore[idx];
    if (relation.status === 'pending' && relation.initiatedBy === currentUserId) {
      throw new Error('Only the specified friend (recipient) can deny this request.');
    }
    friendsStore.splice(idx, 1);
    saveDataToDisk();
    return true;
  }
  return false;
}

