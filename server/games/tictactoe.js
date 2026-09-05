const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winnerOf(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] !== null && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  if (board.every((cell) => cell !== null)) return "draw";
  return null;
}

export function create() {
  return {
    board: Array(9).fill(null),
    turn: 0,
    winner: null,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (playerIndex !== state.turn) return { error: "Not your turn." };
  const cell = Number(action.cell);
  if (!Number.isInteger(cell) || cell < 0 || cell > 8) return { error: "Invalid cell." };
  if (state.board[cell] !== null) return { error: "That square is taken." };
  const board = state.board.slice();
  board[cell] = playerIndex;
  const winner = winnerOf(board);
  return {
    state: {
      board,
      turn: winner === null ? 1 - state.turn : state.turn,
      winner,
    },
  };
}

export function view(state) {
  return state;
}
