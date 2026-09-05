const SIZE = 8;

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function dirsFor(piece) {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.player === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function jumpsFrom(board, r, c, piece) {
  const out = [];
  for (const [dr, dc] of dirsFor(piece)) {
    const mr = r + dr;
    const mc = c + dc;
    const lr = r + 2 * dr;
    const lc = c + 2 * dc;
    if (!inBounds(lr, lc)) continue;
    const mid = board[mr]?.[mc];
    if (mid && mid.player !== piece.player && !board[lr][lc]) {
      out.push({ from: [r, c], to: [lr, lc], capture: [mr, mc] });
    }
  }
  return out;
}

function stepsFrom(board, r, c, piece) {
  const out = [];
  for (const [dr, dc] of dirsFor(piece)) {
    const nr = r + dr;
    const nc = c + dc;
    if (inBounds(nr, nc) && !board[nr][nc]) {
      out.push({ from: [r, c], to: [nr, nc], capture: null });
    }
  }
  return out;
}

function piecesOf(board, player) {
  const list = [];
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      const cell = board[r][c];
      if (cell && cell.player === player) list.push([r, c, cell]);
    }
  }
  return list;
}

export function legalMoves(state) {
  const { board, turn, chain } = state;
  if (chain) {
    const piece = board[chain[0]][chain[1]];
    return piece ? jumpsFrom(board, chain[0], chain[1], piece) : [];
  }
  const jumps = [];
  const steps = [];
  for (const [r, c, piece] of piecesOf(board, turn)) {
    jumps.push(...jumpsFrom(board, r, c, piece));
    steps.push(...stepsFrom(board, r, c, piece));
  }
  return jumps.length ? jumps : steps;
}

export function create() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if ((r + c) % 2 !== 1) continue;
      if (r <= 2) board[r][c] = { player: 1, king: false };
      if (r >= 5) board[r][c] = { player: 0, king: false };
    }
  }
  const state = { board, turn: 0, winner: null, chain: null };
  return { ...state, legal: legalMoves(state) };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (playerIndex !== state.turn) return { error: "Not your turn." };
  const from = action.from;
  const to = action.to;
  if (!Array.isArray(from) || !Array.isArray(to)) return { error: "Invalid move." };
  const legal = legalMoves(state);
  const match = legal.find(
    (m) => m.from[0] === from[0] && m.from[1] === from[1] && m.to[0] === to[0] && m.to[1] === to[1]
  );
  if (!match) return { error: "That move isn't legal." };

  const board = cloneBoard(state.board);
  const piece = board[from[0]][from[1]];
  board[from[0]][from[1]] = null;
  if (match.capture) board[match.capture[0]][match.capture[1]] = null;
  const crowned =
    !piece.king && ((piece.player === 0 && to[0] === 0) || (piece.player === 1 && to[0] === SIZE - 1));
  const moved = { player: piece.player, king: piece.king || crowned };
  board[to[0]][to[1]] = moved;

  let turn = state.turn;
  let chain = null;
  if (match.capture && !crowned) {
    const more = jumpsFrom(board, to[0], to[1], moved);
    if (more.length) chain = to;
  }
  if (!chain) turn = 1 - state.turn;

  const next = { board, turn, winner: null, chain };
  const oppPieces = piecesOf(board, 1 - playerIndex);
  if (!oppPieces.length) next.winner = playerIndex;
  else if (!chain && !legalMoves({ ...next, chain: null }).length) next.winner = 1 - next.turn;

  next.legal = legalMoves(next);
  return { state: next };
}

export function view(state, playerIndex) {
  const legal = playerIndex === state.turn ? state.legal : [];
  return {
    board: state.board,
    turn: state.turn,
    winner: state.winner,
    chain: state.chain,
    legal,
  };
}
