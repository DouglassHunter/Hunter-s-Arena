import { TicTacToeState } from '../../src/types/index.js';

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function createInitialTicTacToeState(
  player1: { id: string; username: string; avatar: string; rating: number },
  player2: { id: string; username: string; avatar: string; rating: number },
  sideChosen: boolean = false
): TicTacToeState {
  return {
    board: Array(9).fill(null),
    currentTurn: 'X',
    players: {
      X: player1,
      O: player2
    },
    scores: { X: 0, O: 0 },
    status: 'active',
    winningLine: null,
    winnerId: null,
    winnerSymbol: null,
    sideChosen
  };
}

export function processTicTacToeMove(
  state: TicTacToeState,
  playerId: string,
  cellIndex: number
): { valid: boolean; error?: string; newState?: TicTacToeState; isFinished?: boolean } {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is already completed.' };
  }

  const symbol = state.currentTurn;
  const expectedPlayer = state.players[symbol];

  if (expectedPlayer.id !== playerId) {
    return { valid: false, error: 'It is not your turn.' };
  }

  if (cellIndex < 0 || cellIndex > 8 || state.board[cellIndex] !== null) {
    return { valid: false, error: 'Invalid or occupied cell.' };
  }

  // Apply move
  const newBoard = [...state.board];
  newBoard[cellIndex] = symbol;

  // Check win
  let winningLine: number[] | null = null;
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
      winningLine = line;
      break;
    }
  }

  let status: 'active' | 'won' | 'draw' = 'active';
  let winnerId: string | null = null;
  let winnerSymbol: 'X' | 'O' | null = null;
  let isFinished = false;

  if (winningLine) {
    status = 'won';
    winnerId = expectedPlayer.id;
    winnerSymbol = symbol;
    isFinished = true;
  } else if (newBoard.every(cell => cell !== null)) {
    status = 'draw';
    isFinished = true;
  }

  const nextTurn: 'X' | 'O' = symbol === 'X' ? 'O' : 'X';

  const newState: TicTacToeState = {
    ...state,
    board: newBoard,
    currentTurn: status === 'active' ? nextTurn : state.currentTurn,
    status,
    winningLine,
    winnerId,
    winnerSymbol
  };

  return { valid: true, newState, isFinished };
}
