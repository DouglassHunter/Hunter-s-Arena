export type GameSlug = 'tic-tac-toe' | 'rock-paper-scissors' | string;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  joinedAt: string;
  soundEnabled: boolean;
  gameStats?: Record<string, {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    winStreak: number;
    bestStreak: number;
  }>;
}

export interface GameDefinition {
  id: string;
  name: string;
  slug: GameSlug;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  active: boolean;
  category: string;
  badge?: string;
  rules: string[];
}

export interface GameRoom {
  id: string;
  roomCode: string;
  gameId: string;
  gameSlug: GameSlug;
  gameName: string;
  hostId: string;
  hostUsername: string;
  hostAvatar: string;
  hostRating: number;
  guestId?: string;
  guestUsername?: string;
  guestAvatar?: string;
  guestRating?: number;
  status: 'waiting' | 'in_game' | 'finished';
  isPrivate: boolean;
  createdAt: number;
  currentPlayers: number;
  maxPlayers: number;
}

export interface TicTacToeState {
  board: (string | null)[]; // 9 cells: 'X' | 'O' | null
  currentTurn: 'X' | 'O';
  players: {
    X: { id: string; username: string; avatar: string; rating: number };
    O: { id: string; username: string; avatar: string; rating: number };
  };
  scores: { X: number; O: number };
  status: 'active' | 'won' | 'draw';
  winningLine: number[] | null;
  winnerId: string | null;
  winnerSymbol: 'X' | 'O' | null;
  sideChosen?: boolean;
}

export type RPSChoice = 'rock' | 'paper' | 'scissors';

export interface RPSRoundHistory {
  round: number;
  choices: { [playerId: string]: RPSChoice };
  winnerId: string | null; // null for draw
  resultText: string;
}

export interface RPSState {
  currentRound: number;
  maxRounds: number; // 5 (Best of 5)
  scores: { [playerId: string]: number }; // First to 3
  choices: { [playerId: string]: RPSChoice | null };
  locked: { [playerId: string]: boolean };
  players: { [playerId: string]: { username: string; avatar: string; rating: number } };
  playerOrder: string[];
  status: 'choosing' | 'revealing' | 'round_end' | 'match_end';
  roundHistory: RPSRoundHistory[];
  lastRoundResult?: {
    choices: { [playerId: string]: RPSChoice };
    winnerId: string | null;
    resultText: string;
  };
  matchWinnerId: string | null;
  countdown: number | null;
}

export interface MatchHistoryItem {
  id: string;
  gameSlug: GameSlug;
  gameName: string;
  player1: { id: string; username: string; avatar: string };
  player2: { id: string; username: string; avatar: string };
  winnerId: string | null; // null if draw
  scoreText: string;
  ratingChanges: { [playerId: string]: number };
  date: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  winStreak: number;
}

export interface FriendItem {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  status: 'online' | 'offline' | 'in_game';
  isPending?: boolean;
  isIncoming?: boolean;
}

export interface SocketClientEvents {
  'room:create': (data: { gameSlug: GameSlug; isPrivate: boolean }) => void;
  'room:join': (data: { roomCode: string }) => void;
  'room:leave': () => void;
  'matchmaking:find': (data: { gameSlug: GameSlug }) => void;
  'matchmaking:cancel': () => void;
  'game:move': (data: { roomCode: string; action: any }) => void;
  'game:rematch': (data: { roomCode: string }) => void;
  'friend:invite': (data: { friendId: string; gameSlug: GameSlug }) => void;
}
