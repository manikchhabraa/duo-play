import { GOAL, WARPS, SNAKES, LADDERS, steps, tileRC } from "../../src/shared/snakesBoard.js";

function clone(state) {
  return {
    ...state,
    positions: state.positions.slice(),
    consecutiveSixes: state.consecutiveSixes.slice(),
    last: state.last ? { ...state.last } : null,
    anim: state.anim ? { ...state.anim, steps: state.anim.steps?.slice() } : null,
  };
}

export function create() {
  return {
    positions: [0, 0],
    turn: 0,
    phase: "roll",
    dice: 0,
    consecutiveSixes: [0, 0],
    winner: null,
    last: { text: "Race to 100. Ladders up, snakes down.", by: null },
    anim: null,
    seq: 0,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (state.turn !== playerIndex) return { error: "Not your turn." };
  if (action.type !== "roll") return { error: "Roll the dice." };
  if (state.phase !== "roll") return { error: "Wait." };

  const s = clone(state);
  s.seq += 1;
  const dice = 1 + Math.floor(Math.random() * 6);
  s.dice = dice;
  if (dice === 6) s.consecutiveSixes[playerIndex] += 1;
  else s.consecutiveSixes[playerIndex] = 0;

  if (s.consecutiveSixes[playerIndex] >= 3) {
    s.consecutiveSixes[playerIndex] = 0;
    s.turn = 1 - playerIndex;
    s.last = { text: "Third 6 — turn skipped", by: playerIndex };
    s.anim = { player: playerIndex, steps: [], warp: null, dice };
    return { state: s };
  }

  const from = s.positions[playerIndex];
  const walked = steps(from, dice);
  let dest = walked[walked.length - 1] ?? from;
  let warp = null;
  if (WARPS[dest]) {
    warp = { from: dest, to: WARPS[dest], snake: Boolean(SNAKES[dest]), ladder: Boolean(LADDERS[dest]) };
    dest = WARPS[dest];
  }
  s.positions[playerIndex] = dest;
  s.anim = { player: playerIndex, steps: walked, warp, dice };

  if (dest === GOAL) {
    s.winner = playerIndex;
    s.phase = "over";
    s.last = { text: "Hit 100 — you win", by: playerIndex };
    return { state: s };
  }

  let text = `Rolled ${dice} → ${dest}`;
  if (warp?.ladder) text = `Rolled ${dice} · ladder to ${dest}`;
  if (warp?.snake) text = `Rolled ${dice} · snake to ${dest}`;

  if (dice === 6) {
    s.last = { text: `${text} · roll again`, by: playerIndex };
  } else {
    s.turn = 1 - playerIndex;
    s.last = { text, by: playerIndex };
  }
  return { state: s };
}

export function view(state, playerIndex) {
  return {
    turn: state.turn,
    phase: state.phase,
    dice: state.dice,
    winner: state.winner,
    last: state.last,
    anim: state.anim,
    you: state.positions[playerIndex],
    foe: state.positions[1 - playerIndex],
    tokens: [
      { player: 0, n: state.positions[0], ...tileRC(state.positions[0]) },
      { player: 1, n: state.positions[1], ...tileRC(state.positions[1]) },
    ],
    seq: state.seq,
    prompt:
      state.winner !== null
        ? "Game over"
        : state.turn !== playerIndex
          ? "Their move"
          : "Roll the dice",
  };
}
