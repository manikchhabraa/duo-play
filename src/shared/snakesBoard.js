export const SIZE = 10;
export const GOAL = 100;

export const LADDERS = {
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

export const SNAKES = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

export const WARPS = { ...LADDERS, ...SNAKES };

export function tileRC(n) {
  if (n <= 0) return { r: 10, c: 0 };
  const i = n - 1;
  const rowFromBottom = Math.floor(i / SIZE);
  const colInRow = i % SIZE;
  const leftToRight = rowFromBottom % 2 === 0;
  const c = leftToRight ? colInRow : SIZE - 1 - colInRow;
  const r = SIZE - 1 - rowFromBottom;
  return { r, c };
}

export function steps(from, dice) {
  const tiles = [];
  let p = from;
  let dir = 1;
  for (let i = 0; i < dice; i += 1) {
    if (p >= GOAL && dir === 1) dir = -1;
    if (p <= 0 && dir === -1) dir = 1;
    p += dir;
    tiles.push(p);
  }
  return tiles;
}
