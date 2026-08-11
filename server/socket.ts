import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameRoom, GameSlug, TicTacToeState, RPSState, UserProfile } from '../src/types/index.js';
import { roomsStore, getUserById, recordMatchCompletion, GAMES_CATALOG, markUserOnline, markUserOffline } from './store.js';
import { createInitialTicTacToeState, processTicTacToeMove } from './games/ticTacToe.js';
import { createInitialRPSState, processRPSChoice, advanceRPSRound } from './games/rockPaperScissors.js';

// Active game states: roomCode -> GameState
const activeGameStates = new Map<string, {
  gameSlug: string;
  state: TicTacToeState | RPSState;
  rematchRequests: Set<string>;
  isBotMatch?: boolean;
  botDifficulty?: 'easy' | 'hard';
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

function checkBoardWinner(board: (string | null)[]): 'X' | 'O' | null {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of winLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }
  return null;
}

function minimax(
  board: (string | null)[],
  depth: number,
  isMaximizing: boolean,
  botSymbol: 'X' | 'O',
  userSymbol: 'X' | 'O'
): { score: number; move?: number } {
  const winner = checkBoardWinner(board);
  if (winner === botSymbol) return { score: 10 - depth };
  if (winner === userSymbol) return { score: depth - 10 };
  const emptyIndices = board.map((c, i) => (c === null ? i : null)).filter(v => v !== null) as number[];
  if (emptyIndices.length === 0) return { score: 0 };

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];
    for (const idx of emptyIndices) {
      board[idx] = botSymbol;
      const result = minimax(board, depth + 1, false, botSymbol, userSymbol);
      board[idx] = null;
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = idx;
      }
    }
    return { score: bestScore, move: bestMove };
  } else {
    let bestScore = Infinity;
    let bestMove = emptyIndices[0];
    for (const idx of emptyIndices) {
      board[idx] = userSymbol;
      const result = minimax(board, depth + 1, true, botSymbol, userSymbol);
      board[idx] = null;
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = idx;
      }
    }
    return { score: bestScore, move: bestMove };
  }
}

function computeSmartTicTacToeMove(
  board: (string | null)[],
  botSymbol: 'X' | 'O',
  userSymbol: 'X' | 'O',
  difficulty: 'easy' | 'hard' = 'easy'
): number {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  const emptyIndices = board.map((cell, idx) => (cell === null ? idx : null)).filter(val => val !== null) as number[];
  if (emptyIndices.length === 0) return 0;

  if (difficulty === 'easy') {
    // EASY MODE: Wins are easier for player.
    // 15% chance to complete a win if bot has 2.
    // 85% chance to pick a random open spot without blocking player.
    if (Math.random() < 0.15) {
      for (const line of winLines) {
        const [a, b, c] = line;
        const cells = [board[a], board[b], board[c]];
        if (cells.filter(c => c === botSymbol).length === 2 && cells.filter(c => c === null).length === 1) {
          return line[cells.indexOf(null)];
        }
      }
    }
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  } else {
    // HARD MODE: Perfect Minimax strategy
    const bestMoveObj = minimax([...board], 0, true, botSymbol, userSymbol);
    if (bestMoveObj.move !== undefined) {
      return bestMoveObj.move;
    }
    return emptyIndices[0];
  }
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

  const difficulty = session.botDifficulty || (tttState as any).botDifficulty || 'easy';
  const chosenCell = computeSmartTicTacToeMove(tttState.board, botSymbol, userSymbol, difficulty);
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

const userSocketsMap = new Map<string, Set<string>>();

export function setupSocketIO(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentUser: UserProfile | null = null;

    const resolveUser = (): UserProfile | null => {
      if (currentUser) return currentUser;
      if (socket.data?.userId) {
        const u = getUserById(socket.data.userId);
        if (u) {
          currentUser = u;
          return u;
        }
      }
      return null;
    };

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

        if (!userSocketsMap.has(u.id)) {
          userSocketsMap.set(u.id, new Set());
        }
        userSocketsMap.get(u.id)!.add(socket.id);
        markUserOnline(u.id);

        // Clear any pending disconnect timeout if reconnecting
        if (disconnectTimeouts.has(u.id)) {
          clearTimeout(disconnectTimeouts.get(u.id));
          disconnectTimeouts.delete(u.id);
        }
      }
    });

    // 1. Create Room
    socket.on('room:create', (data: { gameSlug: GameSlug; isPrivate: boolean }) => {
      const user = resolveUser();
      if (!user) {
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
        hostId: user.id,
        hostUsername: user.username,
        hostAvatar: user.avatar,
        hostRating: user.rating,
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
    socket.on('room:create_bot', (data: { gameSlug: GameSlug; difficulty?: 'easy' | 'hard' }) => {
      const user = resolveUser();
      if (!user) {
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
      const difficulty = data?.difficulty || 'easy';

      let initialState: TicTacToeState | RPSState;
      if (room.gameSlug === 'tic-tac-toe') {
        initialState = createInitialTicTacToeState(
          { id: host.id, username: host.username, avatar: host.avatar, rating: host.rating },
          { id: guest.id, username: guest.username, avatar: guest.avatar, rating: guest.rating }
        );
        (initialState as TicTacToeState).botDifficulty = difficulty;
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
        isBotMatch: true,
        botDifficulty: difficulty
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

    // 1c. Set AI Bot Difficulty
    socket.on('game:set_bot_difficulty', (data: { roomCode: string; difficulty: 'easy' | 'hard' }) => {
      if (!data?.roomCode || !data?.difficulty) return;
      const code = data.roomCode.toUpperCase();
      const session = activeGameStates.get(code);
      if (session && session.isBotMatch) {
        session.botDifficulty = data.difficulty;
        if (session.state) {
          (session.state as TicTacToeState).botDifficulty = data.difficulty;
        }
        io.to(code).emit('game:updated', { gameState: session.state });

        if (session.gameSlug === 'tic-tac-toe') {
          const ttt = session.state as TicTacToeState;
          const botUser = getUserById('usr-bot') || { id: 'usr-bot' };
          if (ttt.status === 'active' && ttt.players[ttt.currentTurn]?.id === botUser.id) {
            clearSessionTimeouts(session);
            addSessionTimeout(session, () => handleBotTicTacToeTurn(io, code), 300);
          }
        }
      }
    });

    // 2. Join Room by Code
    socket.on('room:join', (data: { roomCode: string }) => {
      const user = resolveUser();
      if (!user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const code = data.roomCode.toUpperCase().trim();
      const room = roomsStore.get(code);

      if (!room) {
        socket.emit('error', { message: 'Room not found. Check your code and try again.' });
        return;
      }

      if (room.status === 'in_game' && room.hostId !== user.id && room.guestId !== user.id) {
        socket.emit('error', { message: 'Room is full and match is already in progress.' });
        return;
      }

      // If rejoining host or guest
      if (room.hostId === user.id) {
        currentRoomCode = code;
        socket.join(code);
        socket.emit('room:joined', { room });
        
        // If active game state exists, sync state
        if (activeGameStates.has(code)) {
          socket.emit('game:state_synced', { state: activeGameStates.get(code)!.state });
        }
        return;
      }

      if (room.guestId === user.id) {
        currentRoomCode = code;
        socket.join(code);
        socket.emit('room:joined', { room });

        if (activeGameStates.has(code)) {
          socket.emit('game:state_synced', { state: activeGameStates.get(code)!.state });
        }
        return;
      }

      // Joining as new guest
      room.guestId = user.id;
      room.guestUsername = user.username;
      room.guestAvatar = user.avatar;
      room.guestRating = user.rating;
      room.currentPlayers = 2;
      room.status = 'in_game';

      currentRoomCode = code;
      socket.join(code);

      // Initialize game state on server
      const host = getUserById(room.hostId)!;
      const guest = user;

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
      const user = resolveUser();
      if (!user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const slug = data.gameSlug;
      if (!matchmakingQueues.has(slug)) {
        matchmakingQueues.set(slug, []);
      }

      const queue = matchmakingQueues.get(slug)!;
      // Filter out existing socket/user
      const existingIdx = queue.findIndex(q => q.user.id === user.id);
      if (existingIdx !== -1) queue.splice(existingIdx, 1);

      if (queue.length > 0) {
        // Match found!
        const opponent = queue.shift()!;
        const host = opponent.user;
        const guest = user;

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
        queue.push({ socketId: socket.id, user });
        socket.emit('matchmaking:searching', { gameSlug: slug });
      }
    });

    socket.on('matchmaking:cancel', () => {
      const user = resolveUser();
      if (!user) return;
      for (const queue of matchmakingQueues.values()) {
        const idx = queue.findIndex(q => q.user.id === user.id);
        if (idx !== -1) queue.splice(idx, 1);
      }
      socket.emit('matchmaking:cancelled');
    });

    // 4. Server-Authoritative Game Moves
    socket.on('game:move', (data: { roomCode: string; action: any }) => {
      const user = resolveUser();
      if (!user) return;
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

        const result = processTicTacToeMove(tttState, user.id, cellIndex);
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

        const result = processRPSChoice(rpsState, user.id, choice);
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
            socket.to(code).emit('game:updated', { gameState: sanitizeStateForPlayer(session.state, user.id) });
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

      const user = resolveUser();
      let userId = user?.id;
      let username = user?.username;

      if (!userId) {
        if (room.guestId && room.hostId !== socket.data?.userId) {
          userId = room.guestId || 'usr-bot';
          username = room.guestUsername || 'Guest';
        } else {
          userId = room.hostId;
          username = room.hostUsername;
        }
      }

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
      const user = resolveUser();
      if (!user || !data?.roomCode) return;
      const code = data.roomCode.toUpperCase();
      
      // Broadcast reaction to both players in room
      io.to(code).emit('game:emote_received', {
        username: user.username,
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
      const user = resolveUser();
      if (!user || !currentRoomCode) return;
      const code = currentRoomCode;
      const room = roomsStore.get(code);
      const session = activeGameStates.get(code);

      if (room && session && room.status === 'in_game') {
        room.status = 'finished';
        const remainingWinnerId = room.hostId === user.id ? room.guestId : room.hostId;
        const leaverId = user.id;

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
            message: `${user.username} left the match. Automatic victory granted!`
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
            forfeitMessage: `${user.username} left the match. Automatic victory granted!`
          });
        }
      }

      socket.leave(code);
      currentRoomCode = null;
    });

    // 7b. Challenge 1v1 event
    socket.on('challenge:send', (data: { targetUserId?: string; targetUsername?: string; roomCode: string; gameSlug: GameSlug; gameName: string }) => {
      const user = resolveUser();
      if (!user) return;
      const payload = {
        challenger: user,
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
      const user = resolveUser();
      if (!user) return;
      if (data.action === 'decline') {
        io.to(`user:${data.challengerId}`).emit('challenge:declined', {
          responderName: user.username
        });
      }
    });

    // 7c. Friend Request Real-Time Notification
    socket.on('friend:request_send', (data: { targetUsername: string }) => {
      const user = resolveUser();
      if (!user) return;
      io.to(`user:${data.targetUsername.toLowerCase()}`).emit('friend:request_received', {
        sender: user
      });
    });

    // 8. Disconnect handling
    socket.on('disconnect', () => {
      const user = resolveUser();
      if (user) {
        const userSet = userSocketsMap.get(user.id);
        if (userSet) {
          userSet.delete(socket.id);
          if (userSet.size === 0) {
            userSocketsMap.delete(user.id);
            markUserOnline(user.id);
          }
        }
      }

      if (user && currentRoomCode) {
        const code = currentRoomCode;
        socket.to(code).emit('opponent:disconnected', {
          username: user.username,
          gracePeriodSeconds: 30
        });

        const userId = user.id;
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
                message: `${user?.username} disconnected and forfeited the match.`
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
                forfeitMessage: `${user?.username} disconnected. Automatic victory granted!`
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
