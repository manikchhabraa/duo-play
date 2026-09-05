const COLS = 7;
const ROWS = 6;

function winnerFrom(board, row, col, player) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (const sign of [-1, 1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count += 1;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 4) return player;
  }
  const full = board.every((line) => line.every((cell) => cell !== null));
  return full ? "draw" : null;
}

export function create() {
  return {
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)),
    turn: 0,
    winner: null,
    last: null,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (playerIndex !== state.turn) return { error: "Not your turn." };
  const col = Number(action.col);
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return { error: "Invalid column." };
  let row = -1;
  for (let r = ROWS - 1; r >= 0; r -= 1) {
    if (state.board[r][col] === null) {
      row = r;
      break;
    }
  }
  if (row === -1) return { error: "That column is full." };
  const board = state.board.map((line) => line.slice());
  board[row][col] = playerIndex;
  const winner = winnerFrom(board, row, col, playerIndex);
  return {
    state: {
      board,
      turn: winner === null ? 1 - state.turn : state.turn,
      winner,
      last: { row, col },
    },
  };
}

export function view(state) {
  return state;
}
