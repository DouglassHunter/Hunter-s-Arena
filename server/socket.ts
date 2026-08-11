import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameRoom, GameSlug, TicTacToeState, RPSState, UserProfile } from '../src/types/index.js';
import { roomsStore, getUserById, recordMatchCompletion, GAMES_CATALOG } from './store.js';
import { createInitialTicTacToeState, processTicTacToeMove } from './games/ticTacToe.js';
import { createInitialRPSState, processRPSChoice, advanceRPSRound } from './games/rockPaperScissors.js';

// Active game states: roomCode -> GameState
const activeGameStates = new Map<string, {
  gameSlug: string;
  state: TicTacToeState | RPSState;
  rematchRequests: Set<string>;
  isBotMatch?: boolean;
  pendingTimeouts?: NodeJS.Timeout[];
}>();

function clearSessionTimeouts(session: any) {
  if (session && session.pendingTimeouts) {
    session.pendingTimeouts.forEach((t: NodeJS.Timeout) => clearTimeout(t));
    session.pendingTimeouts = [];
  }
}

function addSessionTimeout(session: any, callback: () => void, ms: number): NodeJS.Timeout {
  if (!session.pendingTimeouts) session.pendingTimeouts = [];
  const t = setTimeout(() => {
    callback();
    if (session.pendingTimeouts) {
      session.pendingTimeouts = session.pendingTimeouts.filter((item: NodeJS.Timeout) => item !== t);
    }
  }, ms);
  session.pendingTimeouts.push(t);
  return t;
}

function computeSmartTicTacToeMove(board: (string | null)[], botSymbol: 'X' | 'O', userSymbol: 'X' | 'O'): number {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  // 1. Can Bot win in 1 move?
  for (const line of winLines) {
    const [a, b, c] = line;
    const cells = [board[a], board[b], board[c]];
    if (cells.filter(c => c === botSymbol).length === 2 && cells.filter(c => c === null).length === 1) {
      return line[cells.indexOf(null)];
    }
  }

  // 2. Can User win in 1 move? Block them!
  for (const line of winLines) {
    const [a, b, c] = line;
    const cells = [board[a], board[b], board[c]];
    if (cells.filter(c => c === userSymbol).length === 2 && cells.filter(c => c === null).length === 1) {
      return line[cells.indexOf(null)];
    }
  }

  // 3. Take Center if free
  if (board[4] === null) return 4;

  // 4. Take corners if free
  const corners = [0, 2, 6, 8].filter(idx => board[idx] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Take any remaining free spot
  const freeIndices = board.map((cell, idx) => cell === null ? idx : null).filter(val => val !== null) as number[];
  if (freeIndices.length > 0) {
    return freeIndices[Math.floor(Math.random() * freeIndices.length)];
  }

  return 0;
}

function handleBotTicTacToeTurn(io: SocketIOServer, code: string) {
  const session = activeGameStates.get(code);
  if (!session || !session.isBotMatch) return;

  const tttState = session.state as TicTacToeState;
  if (tttState.status !== 'active') return;

  const botUser = getUserById('usr-bot') || { id: 'usr-bot' };
  const currentTurnPlayerId = tttState.players[tttState.currentTurn]?.id;
  if (currentTurnPlayerId !== botUser.id) return;

  const botSymbol = tttState.players.X.id === botUser.id ? 'X' : 'O';
  const userSymbol = botSymbol === 'X' ? 'O' : 'X';

  const chosenCell = computeSmartTicTacToeMove(tttState.board, botSymbol, userSymbol);
  const result = processTicTacToeMove(tttState, botUser.id, chosenCell);

  if (result.valid && result.newState) {
    session.state = result.newState;
    io.to(code).emit('game:updated', { gameState: session.state });

    if (result.isFinished) {
      const finalState = session.state as TicTacToeState;
      const room = roomsStore.get(code);
      if (room) {
        room.status = 'finished';
        const matchResult = recordMatchCompletion(
          'tic-tac-toe',
          finalState.players.X.id,
          finalState.players.O.id,
          finalState.winnerId,
          finalState.status === 'won' ? '1 - 0' : '0 - 0'
        );

        io.to(code).emit('game:finished', {
          gameState: finalState,
          ratingChanges: matchResult ? matchResult : {},
          matchRecord: matchResult ? matchResult.matchRecord : null
        });
      }
    }
  }
}

function handleBotRPSChoice(io: SocketIOServer, code: string) {
  const session = activeGameStates.get(code);
  if (!session || !session.isBotMatch) return;

  const rpsState = session.state as RPSState;
  const choices: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  const botUser = getUserById('usr-bot') || { id: 'usr-bot' };
  const result = processRPSChoice(rpsState, botUser.id, botChoice);

  if (result.valid && result.newState) {
    session.state = result.newState;

    io.to(code).emit('game:round_revealed', {
      gameState: session.state,
      roundResult: session.state.lastRoundResult
    });

    if (result.isFinished) {
      const room = roomsStore.get(code);
      if (room) room.status = 'finished';

      const [p1Id, p2Id] = session.state.playerOrder;
      const p1Score = session.state.scores[p1Id] || 0;
      const p2Score = session.state.scores[p2Id] || 0;

      const matchResult = recordMatchCompletion(
        'rock-paper-scissors',
        p1Id,
        p2Id,
        session.state.matchWinnerId,
        `${p1Score} - ${p2Score}`
      );

      addSessionTimeout(session, () => {
        io.to(code).emit('game:finished', {
          gameState: session.state,
          ratingChanges: matchResult ? matchResult : {},
          matchRecord: matchResult ? matchResult.matchRecord : null
        });
      }, 2500);
    } else {
      addSessionTimeout(session, () => {
        if (activeGameStates.has(code)) {
          session.state = advanceRPSRound(session.state as RPSState);
          io.to(code).emit('game:next_round', { gameState: session.state });
        }
      }, 3500);
    }
  }
}

// Matchmaking queues per game slug
const matchmakingQueues = new Map<string, Array<{ socketId: string; user: UserProfile }>>();

// Track disconnect timeouts
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function setupSocketIO(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentUser: UserProfile | null = null;

    // Authenticate socket user
    socket.on('auth:init', (data: { userId: string }) => {
      const u = getUserById(data.userId);
      if (u) {
        currentUser = u;
        socket.data.userId = u.id;
        socket.data.username = u.username;
        socket.join(`user:${u.id}`);
        socket.join(`user:${u.username.toLowerCase()}`);
        socket.emit('auth:success', { user: u });

        // Clear any pending disconnect timeout if reconnecting
        if (disconnectTimeouts.has(u.id)) {
          clearTimeout(disconnectTimeouts.get(u.id));
          disconnectTimeouts.delete(u.id);
        }
      }
    });

    // 1. Create Room
    socket.on('room:create', (data: { gameSlug: GameSlug; isPrivate: boolean }) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const game = GAMES_CATALOG.find(g => g.slug === data.gameSlug);
      if (!game) {
        socket.emit('error', { message: 'Invalid game selected' });
        return;
      }

      let code = generateRoomCode();
      while (roomsStore.has(code)) {
        code = generateRoomCode();
      }

      const room: GameRoom = {
        id: `room-${Date.now()}`,
        roomCode: code,
        gameId: game.id,
        gameSlug: game.slug,
        gameName: game.name,
        hostId: currentUser.id,
        hostUsername: currentUser.username,
        hostAvatar: currentUser.avatar,
        hostRating: currentUser.rating,
        status: 'waiting',
        isPrivate: data.isPrivate ?? false,
        createdAt: Date.now(),
        currentPlayers: 1,
        maxPlayers: 2
      };

      roomsStore.set(code, room);
      currentRoomCode = code;
      socket.join(code);

      socket.emit('room:created', { room });
    });

    // 1b. Create AI Bot Room
    socket.on('room:create_bot', (data: { gameSlug: GameSlug }) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const game = GAMES_CATALOG.find(g => g.slug === data.gameSlug);
      if (!game) {
        socket.emit('error', { message: 'Invalid game selected' });
        return;
      }

      let code = 'BOT-' + generateRoomCode().slice(0, 4);
      while (roomsStore.has(code)) {
        code = 'BOT-' + generateRoomCode().slice(0, 4);
      }

      const botUser = getUserById('usr-bot') || {
        id: 'usr-bot',
        username: "Hunter's Bot 🤖",
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HuntersBot',
        rating: 1300
      };

      const room: GameRoom = {
        id: `room-${Date.now()}`,
        roomCode: code,
        gameId: game.id,
        gameSlug: game.slug,
        gameName: `${game.name} (VS AI Bot)`,
        hostId: currentUser.id,
        hostUsername: currentUser.username,
        hostAvatar: currentUser.avatar,
        hostRating: currentUser.rating,
        guestId: botUser.id,
        guestUsername: botUser.username,
        guestAvatar: botUser.avatar,
        guestRating: botUser.rating,
        status: 'in_game',
        isPrivate: true,
        createdAt: Date.now(),
        currentPlayers: 2,
        maxPlayers: 2
      };

      roomsStore.set(code, room);
      currentRoomCode = code;
      socket.join(code);

      const host = currentUser;
      const guest = botUser;

      let initialState: TicTacToeState | RPSState;
      if (room.gameSlug === 'tic-tac-toe') {
        initialState = createInitialTicTacToeState(
          { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
          { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
        );
      } else {
        initialState = createInitialRPSState(
          { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
          { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
        );
      }

      activeGameStates.set(code, {
        gameSlug: room.gameSlug,
        state: initialState,
        rematchRequests: new Set(),
        isBotMatch: true
      });

      socket.emit('room:created', { room });
      io.to(code).emit('match:started', {
        room,
        gameState: sanitizeStateForPlayer(initialState, currentUser.id)
      });

      if (room.gameSlug === 'tic-tac-toe') {
        const ttt = initialState as TicTacToeState;
        if (ttt.players[ttt.currentTurn]?.id === botUser.id) {
          setTimeout(() => handleBotTicTacToeTurn(io, code), 600);
        }
      }
    });

    // 2. Join Room by Code
    socket.on('room:join', (data: { roomCode: string }) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const code = data.roomCode.toUpperCase().trim();
      const room = roomsStore.get(code);

      if (!room) {
        socket.emit('error', { message: 'Room not found. Check your code and try again.' });
        return;
      }

      if (room.status === 'in_game' && room.hostId !== currentUser.id && room.guestId !== currentUser.id) {
        socket.emit('error', { message: 'Room is full and match is already in progress.' });
        return;
      }

      // If rejoining host or guest
      if (room.hostId === currentUser.id) {
        currentRoomCode = code;
        socket.join(code);
        socket.emit('room:joined', { room });
        
        // If active game state exists, sync state
        if (activeGameStates.has(code)) {
          socket.emit('game:state_synced', { state: activeGameStates.get(code)!.state });
        }
        return;
      }

      if (room.guestId === currentUser.id) {
        currentRoomCode = code;
        socket.join(code);
        socket.emit('room:joined', { room });

        if (activeGameStates.has(code)) {
          socket.emit('game:state_synced', { state: activeGameStates.get(code)!.state });
        }
        return;
      }

      // Joining as new guest
      room.guestId = currentUser.id;
      room.guestUsername = currentUser.username;
      room.guestAvatar = currentUser.avatar;
      room.guestRating = currentUser.rating;
      room.currentPlayers = 2;
      room.status = 'in_game';

      currentRoomCode = code;
      socket.join(code);

      // Initialize game state on server
      const host = getUserById(room.hostId)!;
      const guest = currentUser;

      let initialState: TicTacToeState | RPSState;
      if (room.gameSlug === 'tic-tac-toe') {
        initialState = createInitialTicTacToeState(
          { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
          { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
        );
      } else {
        initialState = createInitialRPSState(
          { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
          { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
        );
      }

      activeGameStates.set(code, {
        gameSlug: room.gameSlug,
        state: initialState,
        rematchRequests: new Set()
      });

      io.to(code).emit('match:started', {
        room,
        gameState: sanitizeStateForPlayer(initialState, '')
      });
    });

    // 3. Matchmaking Queue
    socket.on('matchmaking:find', (data: { gameSlug: GameSlug }) => {
      if (!currentUser) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const slug = data.gameSlug;
      if (!matchmakingQueues.has(slug)) {
        matchmakingQueues.set(slug, []);
      }

      const queue = matchmakingQueues.get(slug)!;
      // Filter out existing socket/user
      const existingIdx = queue.findIndex(q => q.user.id === currentUser!.id);
      if (existingIdx !== -1) queue.splice(existingIdx, 1);

      if (queue.length > 0) {
        // Match found!
        const opponent = queue.shift()!;
        const host = opponent.user;
        const guest = currentUser;

        const code = generateRoomCode();
        const game = GAMES_CATALOG.find(g => g.slug === slug)!;

        const room: GameRoom = {
          id: `room-${Date.now()}`,
          roomCode: code,
          gameId: game.id,
          gameSlug: game.slug,
          gameName: game.name,
          hostId: host.id,
          hostUsername: host.username,
          hostAvatar: host.avatar,
          hostRating: host.rating,
          guestId: guest.id,
          guestUsername: guest.username,
          guestAvatar: guest.avatar,
          guestRating: guest.rating,
          status: 'in_game',
          isPrivate: false,
          createdAt: Date.now(),
          currentPlayers: 2,
          maxPlayers: 2
        };

        roomsStore.set(code, room);

        // Join both sockets to room
        socket.join(code);
        const oppSocket = io.sockets.sockets.get(opponent.socketId);
        if (oppSocket) oppSocket.join(code);

        let initialState: TicTacToeState | RPSState;
        if (slug === 'tic-tac-toe') {
          initialState = createInitialTicTacToeState(
            { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
            { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
          );
        } else {
          initialState = createInitialRPSState(
            { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
            { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
          );
        }

        activeGameStates.set(code, {
          gameSlug: slug,
          state: initialState,
          rematchRequests: new Set()
        });

        io.to(code).emit('match:started', { room, gameState: initialState });
      } else {
        // Add to queue
        queue.push({ socketId: socket.id, user: currentUser });
        socket.emit('matchmaking:searching', { gameSlug: slug });
      }
    });

    socket.on('matchmaking:cancel', () => {
      if (!currentUser) return;
      for (const queue of matchmakingQueues.values()) {
        const idx = queue.findIndex(q => q.user.id === currentUser!.id);
        if (idx !== -1) queue.splice(idx, 1);
      }
      socket.emit('matchmaking:cancelled');
    });

    // 4. Server-Authoritative Game Moves
    socket.on('game:move', (data: { roomCode: string; action: any }) => {
      if (!currentUser) return;
      const code = data.roomCode.toUpperCase();
      const session = activeGameStates.get(code);

      if (!session) {
        socket.emit('error', { message: 'Active game session not found.' });
        return;
      }

      const { gameSlug, state } = session;

      if (gameSlug === 'tic-tac-toe') {
        const tttState = state as TicTacToeState;
        const cellIndex = Number(data.action.cellIndex);

        const result = processTicTacToeMove(tttState, currentUser.id, cellIndex);
        if (!result.valid) {
          socket.emit('error', { message: result.error });
          return;
        }

        session.state = result.newState!;

        // Broadcast updated state to room
        io.to(code).emit('game:updated', { gameState: session.state });

        if (result.isFinished) {
          const finalState = session.state as TicTacToeState;
          const room = roomsStore.get(code);

          if (room) {
            room.status = 'finished';

            const matchResult = recordMatchCompletion(
              'tic-tac-toe',
              finalState.players.X.id,
              finalState.players.O.id,
              finalState.winnerId,
              finalState.status === 'won' ? '1 - 0' : '0 - 0'
            );

            io.to(code).emit('game:finished', {
              gameState: finalState,
              ratingChanges: matchResult ? matchResult : {},
              matchRecord: matchResult ? matchResult.matchRecord : null
            });
          }
        } else if (session.isBotMatch) {
          addSessionTimeout(session, () => handleBotTicTacToeTurn(io, code), 500);
        }
      } else if (gameSlug === 'rock-paper-scissors') {
        const rpsState = state as RPSState;
        const choice = data.action.choice;

        const result = processRPSChoice(rpsState, currentUser.id, choice);
        if (!result.valid) {
          socket.emit('error', { message: result.error });
          return;
        }

        session.state = result.newState!;

        if (!result.roundCompleted) {
          if (session.isBotMatch) {
            socket.emit('game:updated', { gameState: session.state });
            addSessionTimeout(session, () => handleBotRPSChoice(io, code), 400);
          } else {
            // Send update showing that player locked choice without revealing opponent's choice
            socket.emit('game:updated', { gameState: session.state });
            socket.to(code).emit('game:updated', { gameState: sanitizeStateForPlayer(session.state, currentUser.id) });
          }
        } else {
          // Both choices locked! Broadcast reveal state to room
          io.to(code).emit('game:round_revealed', {
            gameState: session.state,
            roundResult: session.state.lastRoundResult
          });

          if (result.isFinished) {
            const room = roomsStore.get(code);
            if (room) room.status = 'finished';

            const [p1Id, p2Id] = session.state.playerOrder;
            const p1Score = session.state.scores[p1Id] || 0;
            const p2Score = session.state.scores[p2Id] || 0;

            const matchResult = recordMatchCompletion(
              'rock-paper-scissors',
              p1Id,
              p2Id,
              session.state.matchWinnerId,
              `${p1Score} - ${p2Score}`
            );

            addSessionTimeout(session, () => {
              io.to(code).emit('game:finished', {
                gameState: session.state,
                ratingChanges: matchResult ? matchResult : {},
                matchRecord: matchResult ? matchResult.matchRecord : null
              });
            }, 2500);
          } else {
            // Schedule next round start after 3.5 second reveal
            addSessionTimeout(session, () => {
              if (activeGameStates.has(code)) {
                session.state = advanceRPSRound(session.state as RPSState);
                io.to(code).emit('game:next_round', { gameState: session.state });
              }
            }, 3500);
          }
        }
      }
    });

    // 5. Rematch Request
    socket.on('game:rematch', (data: { roomCode: string }) => {
      if (!data?.roomCode) return;

      const code = data.roomCode.toUpperCase();
      const session = activeGameStates.get(code);
      const room = roomsStore.get(code);

      if (!session || !room) return;

      const user = currentUser || (socket.data?.userId ? getUserById(socket.data.userId) : null);
      const userId = user?.id || room.hostId;
      const username = user?.username || room.hostUsername;

      session.rematchRequests.add(userId);
      if (session.isBotMatch) {
        session.rematchRequests.add('usr-bot');
      }

      // Acknowledge to sender
      socket.emit('game:rematch_ack', { roomCode: code });

      if (session.rematchRequests.size >= 2) {
        // Clear any leftover timeouts from previous match
        clearSessionTimeouts(session);

        // Both agreed to rematch! Reset state
        const host = getUserById(room.hostId) || {
          id: room.hostId,
          username: room.hostUsername,
          avatar: room.hostAvatar,
          rating: room.hostRating
        };
        const guest = (room.guestId ? getUserById(room.guestId) : null) || {
          id: room.guestId || 'usr-bot',
          username: room.guestUsername || "Hunter's Bot 🤖",
          avatar: room.guestAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=HuntersBot',
          rating: room.guestRating || 1300
        };

        let initialState: TicTacToeState | RPSState;
        if (session.gameSlug === 'tic-tac-toe') {
          initialState = createInitialTicTacToeState(
            { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
            { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating },
            false // sideChosen = false on rematch so players can choose again
          );
        } else {
          initialState = createInitialRPSState(
            { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
            { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
          );
        }

        session.state = initialState;
        session.rematchRequests.clear();
        room.status = 'in_game';

        io.to(code).emit('match:started', { room, gameState: initialState });

        if (session.isBotMatch && session.gameSlug === 'tic-tac-toe') {
          const ttt = initialState as TicTacToeState;
          if (ttt.players[ttt.currentTurn]?.id === guest.id) {
            addSessionTimeout(session, () => handleBotTicTacToeTurn(io, code), 600);
          }
        }
      } else {
        socket.to(code).emit('game:rematch_requested', { username });
      }
    });

    // 5b. Symbol / Side Selection for Tic-Tac-Toe
    socket.on('ttt:select_side', (data: { roomCode: string; side: 'X' | 'O' | 'random' }) => {
      if (!data?.roomCode) return;
      const code = data.roomCode.toUpperCase();
      const session = activeGameStates.get(code);
      const room = roomsStore.get(code);
      if (!session || !room || session.gameSlug !== 'tic-tac-toe') return;

      const state = session.state as TicTacToeState;
      
      const host = getUserById(room.hostId) || {
        id: room.hostId,
        username: room.hostUsername,
        avatar: room.hostAvatar,
        rating: room.hostRating
      };
      const guest = (room.guestId ? getUserById(room.guestId) : null) || {
        id: room.guestId || 'usr-bot',
        username: room.guestUsername || "Hunter's Bot 🤖",
        avatar: room.guestAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=HuntersBot',
        rating: room.guestRating || 1300
      };

      let isHostX = true;
      if (data.side === 'O') {
        isHostX = false;
      } else if (data.side === 'random') {
        isHostX = Math.random() < 0.5;
      }

      const playerX = isHostX ? host : guest;
      const playerO = isHostX ? guest : host;

      state.players = { X: playerX, O: playerO };
      state.board = Array(9).fill(null);
      state.currentTurn = 'X';
      state.sideChosen = true;
      state.status = 'active';

      io.to(code).emit('match:started', { room, gameState: state });

      if (session.isBotMatch && playerX.id === 'usr-bot') {
        clearSessionTimeouts(session);
        addSessionTimeout(session, () => handleBotTicTacToeTurn(io, code), 600);
      }
    });

    // 6. Chat / Emote
    socket.on('game:emote', (data: { roomCode: string; emote: string }) => {
      if (!currentUser || !data?.roomCode) return;
      const code = data.roomCode.toUpperCase();
      
      // Broadcast reaction to both players in room
      io.to(code).emit('game:emote_received', {
        username: currentUser.username,
        emote: data.emote
      });

      // If bot match, bot reacts back after 800ms
      const session = activeGameStates.get(code);
      if (session && session.isBotMatch) {
        const botEmotes = ['🔥', '👏', '😱', '👑', '🗿'];
        const randomEmote = botEmotes[Math.floor(Math.random() * botEmotes.length)];
        setTimeout(() => {
          io.to(code).emit('game:emote_received', {
            username: "Hunter's Bot 🤖",
            emote: randomEmote
          });
        }, 800);
      }
    });

    // 7. Room Leave handling
    socket.on('room:leave', () => {
      if (!currentUser || !currentRoomCode) return;
      const code = currentRoomCode;
      const room = roomsStore.get(code);
      const session = activeGameStates.get(code);

      if (room && session && room.status === 'in_game') {
        room.status = 'finished';
        const remainingWinnerId = room.hostId === currentUser.id ? room.guestId : room.hostId;
        const leaverId = currentUser.id;

        if (remainingWinnerId) {
          const matchResult = recordMatchCompletion(
            session.gameSlug,
            leaverId,
            remainingWinnerId,
            remainingWinnerId,
            'Opponent Forfeit'
          );

          io.to(code).emit('opponent:forfeit', {
            winnerId: remainingWinnerId,
            message: `${currentUser.username} left the match. Automatic victory granted!`
          });

          io.to(code).emit('game:finished', {
            gameState: {
              ...session.state,
              status: 'won',
              winnerId: remainingWinnerId
            },
            ratingChanges: matchResult ? matchResult : {},
            matchRecord: matchResult ? matchResult.matchRecord : null,
            forfeit: true,
            forfeitMessage: `${currentUser.username} left the match. Automatic victory granted!`
          });
        }
      }

      socket.leave(code);
      currentRoomCode = null;
    });

    // 7b. Challenge 1v1 event
    socket.on('challenge:send', (data: { targetUserId?: string; targetUsername?: string; roomCode: string; gameSlug: GameSlug; gameName: string }) => {
      if (!currentUser) return;
      const payload = {
        challenger: currentUser,
        roomCode: data.roomCode,
        gameSlug: data.gameSlug,
        gameName: data.gameName
      };

      if (data.targetUserId) {
        io.to(`user:${data.targetUserId}`).emit('challenge:received', payload);
      }
      if (data.targetUsername) {
        io.to(`user:${data.targetUsername.toLowerCase()}`).emit('challenge:received', payload);
      }
    });

    socket.on('challenge:respond', (data: { roomCode: string; action: 'accept' | 'decline'; challengerId: string }) => {
      if (!currentUser) return;
      if (data.action === 'decline') {
        io.to(`user:${data.challengerId}`).emit('challenge:declined', {
          responderName: currentUser.username
        });
      }
    });

    // 7c. Friend Request Real-Time Notification
    socket.on('friend:request_send', (data: { targetUsername: string }) => {
      if (!currentUser) return;
      io.to(`user:${data.targetUsername.toLowerCase()}`).emit('friend:request_received', {
        sender: currentUser
      });
    });

    // 8. Disconnect handling
    socket.on('disconnect', () => {
      if (currentUser && currentRoomCode) {
        const code = currentRoomCode;
        socket.to(code).emit('opponent:disconnected', {
          username: currentUser.username,
          gracePeriodSeconds: 30
        });

        const userId = currentUser.id;
        const timeout = setTimeout(() => {
          // Grace period elapsed -> forfeit match to opponent
          const session = activeGameStates.get(code);
          const room = roomsStore.get(code);

          if (session && room && room.status === 'in_game') {
            room.status = 'finished';
            const remainingWinnerId = room.hostId === userId ? room.guestId : room.hostId;

            if (remainingWinnerId) {
              const otherUserId = room.hostId === userId ? room.guestId! : room.hostId;
              const matchResult = recordMatchCompletion(
                session.gameSlug,
                userId,
                otherUserId,
                remainingWinnerId,
                'Forfeit'
              );

              io.to(code).emit('opponent:forfeit', {
                winnerId: remainingWinnerId,
                message: `${currentUser?.username} disconnected and forfeited the match.`
              });

              io.to(code).emit('game:finished', {
                gameState: {
                  ...session.state,
                  status: 'won',
                  winnerId: remainingWinnerId
                },
                ratingChanges: matchResult ? matchResult : {},
                matchRecord: matchResult ? matchResult.matchRecord : null,
                forfeit: true,
                forfeitMessage: `${currentUser?.username} disconnected. Automatic victory granted!`
              });
            }
          }
          disconnectTimeouts.delete(userId);
        }, 10000); // reduced grace period to 10s for snappy response

        disconnectTimeouts.set(userId, timeout);
      }
    });
  });
}

function sanitizeStateForPlayer(state: any, playerId: string) {
  // If RPS in 'choosing' mode, do not show opponent's actual choice value
  if (state.maxRounds && state.status === 'choosing') {
    const copy = JSON.parse(JSON.stringify(state));
    for (const id of Object.keys(copy.choices)) {
      if (id !== playerId && copy.choices[id]) {
        copy.choices[id] = 'LOCKED';
      }
    }
    return copy;
  }
  return state;
}
