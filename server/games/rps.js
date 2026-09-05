const BEATS = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

const NEED = 3;

export function create() {
  return {
    scores: [0, 0],
    round: 1,
    picks: [null, null],
    last: null,
    phase: "pick",
    winner: null,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (state.phase !== "pick") return { error: "Wait for the next round." };
  const choice = action.choice;
  if (!BEATS[choice]) return { error: "Pick rock, paper, or scissors." };
  if (state.picks[playerIndex]) return { error: "You already locked in." };
  const picks = state.picks.slice();
  picks[playerIndex] = choice;
  if (!picks[0] || !picks[1]) {
    return { state: { ...state, picks } };
  }
  let roundWinner = null;
  if (picks[0] === picks[1]) roundWinner = "draw";
  else roundWinner = BEATS[picks[0]] === picks[1] ? 0 : 1;
  const scores = [state.scores[0], state.scores[1]];
  if (roundWinner !== "draw") scores[roundWinner] += 1;
  const gameWinner = scores[0] >= NEED ? 0 : scores[1] >= NEED ? 1 : null;
  return {
    state: {
      scores,
      round: state.round,
      picks,
      last: { picks: [picks[0], picks[1]], winner: roundWinner },
      phase: "reveal",
      winner: gameWinner,
    },
    reveal: !gameWinner,
  };
}

export function nextRound(state) {
  if (state.winner !== null) return state;
  return {
    ...state,
    round: state.round + 1,
    picks: [null, null],
    phase: "pick",
  };
}

export function view(state, playerIndex) {
  const hideFoe = state.phase === "pick";
  return {
    scores: state.scores,
    round: state.round,
    phase: state.phase,
    winner: state.winner,
    last: state.last,
    need: NEED,
    youPicked: state.picks[playerIndex] !== null,
    yourPick: state.picks[playerIndex],
    foePicked: state.picks[1 - playerIndex] !== null,
    foePick: hideFoe ? null : state.picks[1 - playerIndex],
    revealed: hideFoe ? null : state.picks,
  };
}
