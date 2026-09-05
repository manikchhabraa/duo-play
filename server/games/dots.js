const N = 4;

function completedBoxes(hEdges, vEdges, r, c, kind) {
  const boxes = [];
  const check = (br, bc) => {
    if (br < 0 || bc < 0 || br >= N || bc >= N) return;
    if (hEdges[br][bc] !== null && hEdges[br + 1][bc] !== null && vEdges[br][bc] !== null && vEdges[br][bc + 1] !== null) {
      boxes.push([br, bc]);
    }
  };
  if (kind === "h") {
    check(r - 1, c);
    check(r, c);
  } else {
    check(r, c - 1);
    check(r, c);
  }
  return boxes;
}

export function create() {
  return {
    n: N,
    hEdges: Array.from({ length: N + 1 }, () => Array(N).fill(null)),
    vEdges: Array.from({ length: N }, () => Array(N + 1).fill(null)),
    boxes: Array.from({ length: N }, () => Array(N).fill(null)),
    scores: [0, 0],
    turn: 0,
    winner: null,
  };
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  if (playerIndex !== state.turn) return { error: "Not your turn." };
  const kind = action.kind;
  const r = Number(action.r);
  const c = Number(action.c);
  if (kind !== "h" && kind !== "v") return { error: "Invalid edge." };

  const hEdges = state.hEdges.map((row) => row.slice());
  const vEdges = state.vEdges.map((row) => row.slice());
  const boxes = state.boxes.map((row) => row.slice());

  if (kind === "h") {
    if (r < 0 || r > N || c < 0 || c >= N) return { error: "Invalid edge." };
    if (hEdges[r][c] !== null) return { error: "Edge already claimed." };
    hEdges[r][c] = playerIndex;
  } else {
    if (r < 0 || r >= N || c < 0 || c > N) return { error: "Invalid edge." };
    if (vEdges[r][c] !== null) return { error: "Edge already claimed." };
    vEdges[r][c] = playerIndex;
  }

  const gained = completedBoxes(hEdges, vEdges, r, c, kind).filter(([br, bc]) => boxes[br][bc] === null);
  for (const [br, bc] of gained) boxes[br][bc] = playerIndex;
  const scores = [state.scores[0], state.scores[1]];
  scores[playerIndex] += gained.length;
  const filled = boxes.flat().every((owner) => owner !== null);
  let winner = null;
  if (filled) {
    if (scores[0] > scores[1]) winner = 0;
    else if (scores[1] > scores[0]) winner = 1;
    else winner = "draw";
  }
  const extra = gained.length > 0 && !filled;
  return {
    state: {
      n: N,
      hEdges,
      vEdges,
      boxes,
      scores,
      turn: extra ? playerIndex : 1 - state.turn,
      winner,
    },
  };
}

export function view(state) {
  return state;
}
