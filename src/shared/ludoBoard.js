/** 15x15 Ludo: red (P0) vs yellow (P1). Main loop is 52 squares, clockwise. */

export const MAIN_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], [6, 0],
];

export const START_OFFSET = [0, 26];
export const SAFE_MAIN = [0, 8, 13, 21, 26, 34, 39, 47];
export const STRETCH_START = 51;
export const HOME = 56;

export const STRETCH = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
];

export const HOMES = [
  [7, 6],
  [7, 8],
];

export const YARDS = [
  [[2, 2], [2, 4], [4, 2], [4, 4]],
  [[10, 10], [10, 12], [12, 10], [12, 12]],
];

export const COLORS = ["#e23d3d", "#f0c41a"];

export function toMain(player, pos) {
  if (pos < 0 || pos > 50) return null;
  return (START_OFFSET[player] + pos) % 52;
}

export function cellFor(player, token, pos) {
  if (pos < 0) return YARDS[player][token];
  if (pos <= 50) return MAIN_PATH[toMain(player, pos)];
  if (pos < HOME) return STRETCH[player][pos - STRETCH_START];
  return HOMES[player];
}

export function walkCells(player, token, from, to) {
  if (from === to) return [cellFor(player, token, to)];
  if (from < 0) return [cellFor(player, token, to)];
  const cells = [];
  for (let p = from + 1; p <= to; p += 1) cells.push(cellFor(player, token, p));
  return cells;
}
