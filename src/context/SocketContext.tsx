import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { GameRoom, GameSlug, TicTacToeState, RPSState } from '../types/index.js';

interface SocketContextType {
  socket: Socket | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  activeRoom: GameRoom | null;
  gameState: TicTacToeState | RPSState | null;
  isSearching: boolean;
  searchGameSlug: GameSlug | null;
  rematchRequested: boolean;
  myRematchRequested: boolean;
  matchFinishedData: any | null;
  opponentDisconnected: { username: string; gracePeriodSeconds: number } | null;
  incomingChallenge: { challenger: any; roomCode: string; gameSlug: GameSlug; gameName: string } | null;
  incomingFriendRequest: { sender: any } | null;
  declinedNotification: string | null;
  latestEmote: { username: string; emote: string; timestamp: number } | null;
  createRoom: (gameSlug: GameSlug, isPrivate?: boolean) => void;
  createBotMatch: (gameSlug: GameSlug, difficulty?: 'easy' | 'hard') => void;
  setBotDifficulty: (difficulty: 'easy' | 'hard') => void;
  joinRoom: (roomCode: string) => void;
  leaveRoom: () => void;
  findMatch: (gameSlug: GameSlug) => void;
  cancelMatchmaking: () => void;
  sendMove: (action: any) => void;
  requestRematch: () => void;
  sendEmote: (emote: string) => void;
  selectTicTacToeSide: (side: 'X' | 'O' | 'random') => void;
  clearMatchState: () => void;
  sendDirectChallenge: (data: { targetUserId?: string; targetUsername?: string; roomCode: string; gameSlug: GameSlug; gameName: string }) => void;
  createChallengeRoom: (targetUserId: string, targetUsername: string, gameSlug: GameSlug) => void;
  respondToChallenge: (accept: boolean) => void;
  sendFriendRequestNotification: (targetUsername: string) => void;
  dismissChallenge: () => void;
  dismissFriendRequestNotification: () => void;
  dismissDeclinedNotification: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshProfile } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const [activeRoom, setActiveRoom] = useState<GameRoom | null>(null);
  const [gameState, setGameState] = useState<TicTacToeState | RPSState | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchGameSlug, setSearchGameSlug] = useState<GameSlug | null>(null);
  const [matchFinishedData, setMatchFinishedData] = useState<any | null>(null);
  const [rematchRequested, setRematchRequested] = useState<boolean>(false);
  const [myRematchRequested, setMyRematchRequested] = useState<boolean>(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState<{ username: string; gracePeriodSeconds: number } | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<{ challenger: any; roomCode: string; gameSlug: GameSlug; gameName: string } | null>(null);
  const [incomingFriendRequest, setIncomingFriendRequest] = useState<{ sender: any } | null>(null);
  const [declinedNotification, setDeclinedNotification] = useState<string | null>(null);
  const [latestEmote, setLatestEmote] = useState<{ username: string; emote: string; timestamp: number } | null>(null);

  useEffect(() => {
    if (socket && connectionStatus === 'connected' && user?.id) {
      socket.emit('auth:init', { userId: user.id });
    }
  }, [socket, connectionStatus, user?.id]);

  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setConnectionStatus('connected');
      if (user) {
        s.emit('auth:init', { userId: user.id });
      }
    });

    s.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    s.on('reconnect_attempt', () => {
      setConnectionStatus('connecting');
    });

    s.on('room:created', (data: { room: GameRoom }) => {
      setActiveRoom(data.room);
    });

    s.on('room:joined', (data: { room: GameRoom }) => {
      setActiveRoom(data.room);
    });

    s.on('match:started', (data: { room: GameRoom; gameState: any }) => {
      setIsSearching(false);
      setSearchGameSlug(null);
      setActiveRoom(data.room);
      setGameState(data.gameState);
      setMatchFinishedData(null);
      setRematchRequested(false);
      setMyRematchRequested(false);
      setOpponentDisconnected(null);
    });

    s.on('game:updated', (data: { gameState: any }) => {
      setGameState(data.gameState);
    });

    s.on('game:round_revealed', (data: { gameState: any; roundResult: any }) => {
      setGameState(data.gameState);
    });

    s.on('game:next_round', (data: { gameState: any }) => {
      setGameState(data.gameState);
    });

    s.on('game:state_synced', (data: { state: any }) => {
      setGameState(data.state);
    });

    s.on('game:finished', (data: { gameState: any; ratingChanges: any; matchRecord: any }) => {
      setGameState(data.gameState);
      setMatchFinishedData(data);
      refreshProfile();
    });

    s.on('game:rematch_requested', () => {
      setRematchRequested(true);
    });

    s.on('game:rematch_ack', () => {
      setMyRematchRequested(true);
    });

    s.on('matchmaking:searching', (data: { gameSlug: GameSlug }) => {
      setIsSearching(true);
      setSearchGameSlug(data.gameSlug);
    });

    s.on('matchmaking:cancelled', () => {
      setIsSearching(false);
      setSearchGameSlug(null);
    });

    s.on('opponent:disconnected', (data: { username: string; gracePeriodSeconds: number }) => {
      setOpponentDisconnected(data);
    });

    s.on('opponent:forfeit', () => {
      setOpponentDisconnected(null);
      refreshProfile();
    });

    s.on('challenge:received', (data: { challenger: any; roomCode: string; gameSlug: GameSlug; gameName: string }) => {
      setIncomingChallenge(data);
    });

    s.on('challenge:declined', (data: { responderName: string }) => {
      setDeclinedNotification(`${data.responderName} declined your 1v1 duel challenge.`);
    });

    s.on('friend:request_received', (data: { sender: any }) => {
      setIncomingFriendRequest(data);
    });

    s.on('game:emote_received', (data: { username: string; emote: string }) => {
      setLatestEmote({ username: data.username, emote: data.emote, timestamp: Date.now() });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user && connectionStatus === 'connected') {
      socket.emit('auth:init', { userId: user.id });
    }
  }, [user, socket, connectionStatus]);

  const createRoom = (gameSlug: GameSlug, isPrivate: boolean = false) => {
    if (socket) socket.emit('room:create', { gameSlug, isPrivate });
  };

  const createBotMatch = (gameSlug: GameSlug, difficulty: 'easy' | 'hard' = 'easy') => {
    if (socket) socket.emit('room:create_bot', { gameSlug, difficulty });
  };

  const setBotDifficulty = (difficulty: 'easy' | 'hard') => {
    if (socket && activeRoom) {
      socket.emit('game:set_bot_difficulty', { roomCode: activeRoom.roomCode, difficulty });
    }
  };

  const joinRoom = (roomCode: string) => {
    if (socket) socket.emit('room:join', { roomCode });
  };

  const leaveRoom = () => {
    if (socket) socket.emit('room:leave');
    setActiveRoom(null);
    setGameState(null);
    setMatchFinishedData(null);
    setRematchRequested(false);
    setMyRematchRequested(false);
    setOpponentDisconnected(null);
  };

  const findMatch = (gameSlug: GameSlug) => {
    if (socket) socket.emit('matchmaking:find', { gameSlug });
  };

  const cancelMatchmaking = () => {
    if (socket) socket.emit('matchmaking:cancel');
  };

  const sendMove = (action: any) => {
    if (socket && activeRoom) {
      socket.emit('game:move', { roomCode: activeRoom.roomCode, action });
    }
  };

  const requestRematch = () => {
    if (socket && activeRoom) {
      setMyRematchRequested(true);
      socket.emit('game:rematch', { roomCode: activeRoom.roomCode });
    }
  };

  const sendEmote = (emote: string) => {
    if (socket && activeRoom) {
      socket.emit('game:emote', { roomCode: activeRoom.roomCode, emote });
    }
  };

  const selectTicTacToeSide = (side: 'X' | 'O' | 'random') => {
    if (socket && activeRoom) {
      socket.emit('ttt:select_side', { roomCode: activeRoom.roomCode, side });
    }
  };

  const clearMatchState = () => {
    setActiveRoom(null);
    setGameState(null);
    setMatchFinishedData(null);
  };

  const sendDirectChallenge = (data: { targetUserId?: string; targetUsername?: string; roomCode: string; gameSlug: GameSlug; gameName: string }) => {
    if (socket) socket.emit('challenge:send', data);
  };

  const createChallengeRoom = (targetUserId: string, targetUsername: string, gameSlug: GameSlug) => {
    if (!socket) return;
    const gameName = gameSlug === 'tic-tac-toe' ? 'Tic-Tac-Toe' : 'Rock-Paper-Scissors';
    socket.emit('room:create', { gameSlug, isPrivate: true });

    const onRoomCreated = (data: { room: GameRoom }) => {
      socket.emit('challenge:send', {
        targetUserId,
        targetUsername,
        roomCode: data.room.roomCode,
        gameSlug,
        gameName
      });
      socket.off('room:created', onRoomCreated);
    };
    socket.on('room:created', onRoomCreated);
  };

  const respondToChallenge = (accept: boolean) => {
    if (!incomingChallenge) return;
    if (accept) {
      if (socket) {
        socket.emit('challenge:respond', {
          roomCode: incomingChallenge.roomCode,
          action: 'accept',
          challengerId: incomingChallenge.challenger.id
        });
        socket.emit('room:join', { roomCode: incomingChallenge.roomCode });
      }
    } else {
      if (socket) {
        socket.emit('challenge:respond', {
          roomCode: incomingChallenge.roomCode,
          action: 'decline',
          challengerId: incomingChallenge.challenger.id
        });
      }
    }
    setIncomingChallenge(null);
  };

  const sendFriendRequestNotification = (targetUsername: string) => {
    if (socket) socket.emit('friend:request_send', { targetUsername });
  };

  const dismissChallenge = () => setIncomingChallenge(null);
  const dismissFriendRequestNotification = () => setIncomingFriendRequest(null);
  const dismissDeclinedNotification = () => setDeclinedNotification(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connectionStatus,
        activeRoom,
        gameState,
        isSearching,
        searchGameSlug,
        rematchRequested,
        myRematchRequested,
        matchFinishedData,
        opponentDisconnected,
        incomingChallenge,
        incomingFriendRequest,
        declinedNotification,
        latestEmote,
        createRoom,
        createBotMatch,
        setBotDifficulty,
        joinRoom,
        leaveRoom,
        findMatch,
        cancelMatchmaking,
        sendMove,
        requestRematch,
        sendEmote,
        selectTicTacToeSide,
        clearMatchState,
        sendDirectChallenge,
        createChallengeRoom,
        respondToChallenge,
        sendFriendRequestNotification,
        dismissChallenge,
        dismissFriendRequestNotification,
        dismissDeclinedNotification
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
