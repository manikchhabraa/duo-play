const SIZE = 8;
const FLEET = [
  { id: "battleship", name: "Battleship", len: 4 },
  { id: "cruiser", name: "Cruiser", len: 3 },
  { id: "destroyer", name: "Destroyer", len: 3 },
  { id: "sub", name: "Sub", len: 2 },
  { id: "patrol", name: "Patrol", len: 2 },
];

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function occupies(ships) {
  const cells = new Set();
  for (const ship of ships) {
    for (const [r, c] of ship.cells) cells.add(`${r},${c}`);
  }
  return cells;
}

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

export function randomFleet() {
  const ships = [];
  for (const spec of FLEET) {
    let placed = null;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const vertical = Math.random() < 0.5;
      const r = randomInt(vertical ? SIZE - spec.len + 1 : SIZE);
      const c = randomInt(vertical ? SIZE : SIZE - spec.len + 1);
      const cells = [];
      let ok = true;
      const taken = occupies(ships);
      for (let i = 0; i < spec.len; i += 1) {
        const rr = r + (vertical ? i : 0);
        const cc = c + (vertical ? 0 : i);
        if (taken.has(`${rr},${cc}`)) {
          ok = false;
          break;
        }
        cells.push([rr, cc]);
      }
      if (ok) {
        placed = { id: spec.id, name: spec.name, cells, sunk: false };
        break;
      }
    }
    if (!placed) return randomFleet();
    ships.push(placed);
  }
  return ships;
}

function playerSide() {
  return {
    ships: randomFleet(),
    ready: false,
    incoming: {},
  };
}

export function create() {
  return {
    phase: "placing",
    turn: 0,
    sides: [playerSide(), playerSide()],
    winner: null,
    lastShot: null,
  };
}

function shipAt(ships, r, c) {
  return ships.find((ship) => ship.cells.some(([sr, sc]) => sr === r && sc === c)) || null;
}

export function apply(state, playerIndex, action) {
  if (state.winner !== null) return { error: "Game already finished." };
  const me = state.sides[playerIndex];

  if (action.type === "shuffle") {
    if (state.phase !== "placing" || me.ready) return { error: "Can't shuffle now." };
    const sides = state.sides.map((side, i) =>
      i === playerIndex ? { ...side, ships: randomFleet() } : side
    );
    return { state: { ...state, sides } };
  }

  if (action.type === "ready") {
    if (state.phase !== "placing") return { error: "Already fighting." };
    if (me.ready) return { state };
    const sides = state.sides.map((side, i) =>
      i === playerIndex ? { ...side, ready: true } : side
    );
    const both = sides.every((side) => side.ready);
    return {
      state: {
        ...state,
        sides,
        phase: both ? "battle" : "placing",
        turn: 0,
      },
    };
  }

  if (action.type === "fire") {
    if (state.phase !== "battle") return { error: "Place your fleet first." };
    if (playerIndex !== state.turn) return { error: "Not your turn." };
    const r = Number(action.r);
    const c = Number(action.c);
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
      return { error: "Invalid shot." };
    }
    const foeIndex = 1 - playerIndex;
    const foe = state.sides[foeIndex];
    const key = `${r},${c}`;
    if (foe.incoming[key]) return { error: "You already shot there." };
    const hitShip = shipAt(foe.ships, r, c);
    const result = hitShip ? "hit" : "miss";
    const incoming = { ...foe.incoming, [key]: result };
    const ships = foe.ships.map((ship) => {
      if (ship.id !== hitShip?.id) return ship;
      const sunk = ship.cells.every(([sr, sc]) => incoming[`${sr},${sc}`] === "hit");
      return { ...ship, sunk };
    });
    const allSunk = ships.every((ship) => ship.sunk);
    const sides = state.sides.map((side, i) =>
      i === foeIndex ? { ...side, incoming, ships } : side
    );
    return {
      state: {
        ...state,
        sides,
        turn: result === "hit" && !allSunk ? playerIndex : foeIndex,
        winner: allSunk ? playerIndex : null,
        phase: allSunk ? "over" : "battle",
        lastShot: { r, c, result, by: playerIndex, sunk: hitShip ? ships.find((s) => s.id === hitShip.id).sunk : false },
      },
    };
  }

  return { error: "Unknown action." };
}

export function view(state, playerIndex) {
  const me = state.sides[playerIndex];
  const foe = state.sides[1 - playerIndex];
  const radar = emptyGrid();
  for (const [key, result] of Object.entries(foe.incoming)) {
    const [r, c] = key.split(",").map(Number);
    radar[r][c] = result;
  }
  const fleet = emptyGrid();
  for (const ship of me.ships) {
    for (const [r, c] of ship.cells) {
      fleet[r][c] = ship.sunk ? "sunk" : "ship";
    }
  }
  for (const [key, result] of Object.entries(me.incoming)) {
    const [r, c] = key.split(",").map(Number);
    fleet[r][c] = result === "hit" ? (fleet[r][c] === "sunk" ? "sunk" : "hit") : "miss";
  }
  return {
    phase: state.phase,
    turn: state.turn,
    winner: state.winner,
    lastShot: state.lastShot,
    youReady: me.ready,
    foeReady: foe.ready,
    radar,
    fleet,
    ships: me.ships.map((s) => ({ id: s.id, name: s.name, len: s.cells.length, sunk: s.sunk })),
    foeSunk: foe.ships.filter((s) => s.sunk).map((s) => ({ id: s.id, name: s.name, len: s.cells.length })),
    size: SIZE,
  };
}
