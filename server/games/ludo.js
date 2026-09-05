import {
  HOME,
  SAFE_MAIN,
  STRETCH_START,
  cellFor,
  toMain,
  walkCells,
} from "../../src/shared/ludoBoard.js";

function clone(state) {
  return {
    ...state,
    positions: [state.positions[0].slice(), state.positions[1].slice()],
    consecutiveSixes: state.consecutiveSixes.slice(),
    last: state.last ? { ...state.last } : null,
  };
}

function occupantMain(state, mainIdx) {
  for (let p = 0; p < 2; p += 1) {
    for (let t = 0; t < 4; t += 1) {
      const pos = state.positions[p][t];
      if (pos >= 0 && pos <= 50 && toMain(p, pos) === mainIdx) return { p, t };
    }
  }
  return null;
}

function ownOn(state, player, pos, skipToken) {
  if (pos === HOME) return false;
  return state.positions[player].some((p, i) => i !== skipToken && p === pos && p >= 0);
}

function isSafe(player, pos) {
  if (pos < 0 || pos >= STRETCH_START) return true;
  const main = toMain(player, pos);
  return SAFE_MAIN.includes(main);
}

function legalMoves(state, player, dice) {
  const moves = [];
  for (let t = 0; t < 4; t += 1) {
    const pos = state.positions[player][t];
    if (pos === HOME) continue;
    if (pos < 0) {
      if (dice !== 6) continue;
      if (ownOn(state, player, 0, t)) continue;
      const sit = occupantMain(state, toMain(player, 0));
      if (sit && sit.p === player) continue;
      if (sit && sit.p !== player) {
        const theirPos = state.positions[sit.p][sit.t];
        if (isSafe(sit.p, theirPos)) continue;
      }
      moves.push({ token: t, from: pos, to: 0 });
      continue;
    }
    const dest = pos + dice;
    if (dest > HOME) continue;
    if (ownOn(state, player, dest, t)) continue;
    if (dest <= 50) {
      const sit = occupantMain(state, toMain(player, dest));
      if (sit && sit.p === player) continue;
      if (sit && sit.p !== player) {
        const theirPos = state.positions[sit.p][sit.t];
        if (isSafe(sit.p, theirPos)) continue;
      }
    }
    moves.push({ token: t, from: pos, to: dest });
  }
  return moves;
}

function captureAt(state, player, dest) {
  if (dest < 0 || dest > 50) return null;
  if (isSafe(player, dest)) return null;
  const sit = occupantMain(state, toMain(player, dest));
  if (!sit || sit.p === player) return null;
  const theirPos = state.positions[sit.p][sit.t];
  if (isSafe(sit.p, theirPos)) return null;
  return sit;
}

export function create() {
  return {
    positions: [
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
    ],
    turn: 0,
    phase: "roll",
    dice: 0,
    consecutiveSixes: [0, 0],
    winner: null,
    last: { text: "Roll to leave the yard (need a 6)", by: null },
    anim: null,
    legal: [],
    seq: 0,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (state.turn !== playerIndex) return { error: "Not your turn." };
  const s = clone(state);
  s.anim = null;
  s.seq += 1;

  if (action.type === "roll") {
    if (s.phase !== "roll") return { error: "Move a token first." };
    const dice = 1 + Math.floor(Math.random() * 6);
    s.dice = dice;
    if (dice === 6) s.consecutiveSixes[playerIndex] += 1;
    else s.consecutiveSixes[playerIndex] = 0;

    if (s.consecutiveSixes[playerIndex] >= 3) {
      s.consecutiveSixes[playerIndex] = 0;
      s.phase = "roll";
      s.turn = 1 - playerIndex;
      s.legal = [];
      s.last = { text: "Third 6 in a row — turn skipped", by: playerIndex };
      return { state: s };
    }

    const legal = legalMoves(s, playerIndex, dice);
    s.legal = legal;
    if (!legal.length) {
      s.last = { text: `Rolled ${dice} — no moves`, by: playerIndex };
      if (dice === 6) {
        s.phase = "roll";
      } else {
        s.phase = "roll";
        s.turn = 1 - playerIndex;
      }
      return { state: s };
    }
    s.phase = "move";
    s.last = { text: `Rolled ${dice}`, by: playerIndex };
    return { state: s };
  }

  if (action.type === "move") {
    if (s.phase !== "move") return { error: "Roll first." };
    const token = Number(action.token);
    const move = s.legal.find((m) => m.token === token);
    if (!move) return { error: "That token can't move." };

    const captured = captureAt(s, playerIndex, move.to);
    s.positions[playerIndex][token] = move.to;
    let extra = s.dice === 6;
    let text = `Moved with ${s.dice}`;
    if (captured) {
      s.positions[captured.p][captured.t] = -1;
      extra = true;
      text = "Captured! Extra turn";
    }
    if (move.to === HOME) {
      extra = true;
      text = "Home! Extra turn";
    }
    if (s.positions[playerIndex].every((p) => p === HOME)) {
      s.winner = playerIndex;
      s.phase = "over";
      s.legal = [];
      s.last = { text: "All tokens home", by: playerIndex };
      s.anim = {
        player: playerIndex,
        token,
        cells: walkCells(playerIndex, token, move.from, move.to),
        captured: captured ? { player: captured.p, token: captured.t } : null,
      };
      return { state: s };
    }
    s.anim = {
      player: playerIndex,
      token,
      cells: walkCells(playerIndex, token, move.from, move.to),
      captured: captured ? { player: captured.p, token: captured.t } : null,
    };
    s.phase = "roll";
    s.legal = [];
    if (!extra) {
      s.consecutiveSixes[playerIndex] = 0;
      s.turn = 1 - playerIndex;
    }
    s.last = { text, by: playerIndex };
    return { state: s };
  }

  return { error: "Unknown action." };
}

export function view(state, playerIndex) {
  const tokens = [];
  for (let p = 0; p < 2; p += 1) {
    for (let t = 0; t < 4; t += 1) {
      const pos = state.positions[p][t];
      const [r, c] = cellFor(p, t, pos);
      tokens.push({
        player: p,
        token: t,
        r,
        c,
        pos,
        home: pos === HOME,
        yard: pos < 0,
        canMove: p === playerIndex && (state.legal || []).some((m) => m.token === t),
      });
    }
  }
  return {
    turn: state.turn,
    phase: state.phase,
    dice: state.dice,
    winner: state.winner,
    last: state.last,
    anim: state.anim,
    tokens,
    seq: state.seq,
    prompt:
      state.winner !== null
        ? "Game over"
        : state.turn !== playerIndex
          ? "Their move"
          : state.phase === "roll"
            ? "Roll the dice"
            : "Tap a glowing token",
  };
}
