import { RPSChoice, RPSState } from '../../src/types/index.js';

export function createInitialRPSState(
  player1: { id: string; username: string; avatar: string; rating: number },
  player2: { id: string; username: string; avatar: string; rating: number }
): RPSState {
  const p1Id = player1.id;
  const p2Id = player2.id;

  return {
    currentRound: 1,
    maxRounds: 5,
    scores: { [p1Id]: 0, [p2Id]: 0 },
    choices: { [p1Id]: null, [p2Id]: null },
    locked: { [p1Id]: false, [p2Id]: false },
    players: {
      [p1Id]: player1,
      [p2Id]: player2
    },
    playerOrder: [p1Id, p2Id],
    status: 'choosing',
    roundHistory: [],
    matchWinnerId: null,
    countdown: null
  };
}

export function processRPSChoice(
  state: RPSState,
  playerId: string,
  choice: RPSChoice
): { valid: boolean; error?: string; newState?: RPSState; roundCompleted?: boolean; isFinished?: boolean } {
  if (state.status !== 'choosing') {
    return { valid: false, error: 'Cannot choose right now.' };
  }

  if (!state.playerOrder.includes(playerId)) {
    return { valid: false, error: 'Player not part of this match.' };
  }

  if (!['rock', 'paper', 'scissors'].includes(choice)) {
    return { valid: false, error: 'Invalid choice.' };
  }

  // Set player's choice and mark locked
  const newChoices = { ...state.choices, [playerId]: choice };
  const newLocked = { ...state.locked, [playerId]: true };

  const [p1Id, p2Id] = state.playerOrder;
  const bothSubmitted = newLocked[p1Id] && newLocked[p2Id];

  if (!bothSubmitted) {
    // Only one player locked choice so far.
    // Return newState where choices object hides actual selections if sent to client or locked is true.
    const newState: RPSState = {
      ...state,
      choices: newChoices,
      locked: newLocked
    };
    return { valid: true, newState, roundCompleted: false };
  }

  // Both submitted! Evaluate round outcome.
  const c1 = newChoices[p1Id]!;
  const c2 = newChoices[p2Id]!;

  const p1Name = state.players[p1Id].username;
  const p2Name = state.players[p2Id].username;

  let winnerId: string | null = null;
  let resultText = 'DRAW!';

  if (c1 === c2) {
    resultText = 'Round Draw! Both chose ' + c1.toUpperCase();
  } else if (
    (c1 === 'rock' && c2 === 'scissors') ||
    (c1 === 'scissors' && c2 === 'paper') ||
    (c1 === 'paper' && c2 === 'rock')
  ) {
    winnerId = p1Id;
    resultText = `${p1Name} won round with ${c1.toUpperCase()} vs ${c2.toUpperCase()}`;
  } else {
    winnerId = p2Id;
    resultText = `${p2Name} won round with ${c2.toUpperCase()} vs ${c1.toUpperCase()}`;
  }

  const newScores = { ...state.scores };
  if (winnerId) {
    newScores[winnerId] = (newScores[winnerId] || 0) + 1;
  }

  const roundEntry = {
    round: state.currentRound,
    choices: { [p1Id]: c1, [p2Id]: c2 },
    winnerId,
    resultText
  };

  const newRoundHistory = [...state.roundHistory, roundEntry];

  // Check if someone reached 3 wins (Best of 5)
  let matchWinnerId: string | null = null;
  let isFinished = false;

  if (newScores[p1Id] >= 3) {
    matchWinnerId = p1Id;
    isFinished = true;
  } else if (newScores[p2Id] >= 3) {
    matchWinnerId = p2Id;
    isFinished = true;
  }

  const newState: RPSState = {
    ...state,
    choices: newChoices,
    locked: newLocked,
    scores: newScores,
    status: isFinished ? 'match_end' : 'revealing',
    roundHistory: newRoundHistory,
    lastRoundResult: {
      choices: { [p1Id]: c1, [p2Id]: c2 },
      winnerId,
      resultText
    },
    matchWinnerId
  };

  return { valid: true, newState, roundCompleted: true, isFinished };
}

export function advanceRPSRound(state: RPSState): RPSState {
  if (state.status === 'match_end') return state;

  const [p1Id, p2Id] = state.playerOrder;

  return {
    ...state,
    currentRound: state.currentRound + 1,
    choices: { [p1Id]: null, [p2Id]: null },
    locked: { [p1Id]: false, [p2Id]: false },
    status: 'choosing',
    lastRoundResult: undefined
  };
}
