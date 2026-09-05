export const GAMES = [
  { id: "ludo", name: "Ludo", blurb: "Race four tokens home. Capture on the path.", mark: "♟" },
  { id: "snakes", name: "Snakes & Ladders", blurb: "Climb ladders. Slide down snakes. First to 100.", mark: "🪜" },
  { id: "uno", name: "Uno", blurb: "Match color or number. First to empty wins.", mark: "▣" },
  { id: "tictactoe", name: "Tic-Tac-Toe", blurb: "Three in a row. Instant duel.", mark: "＋" },
  { id: "connect4", name: "Connect Four", blurb: "Drop discs. Line up four.", mark: "◉" },
  { id: "battleship", name: "Battleship", blurb: "Hide your fleet. Hunt theirs.", mark: "◈" },
  { id: "checkers", name: "Checkers", blurb: "Jump, king, clear the board.", mark: "●" },
  { id: "dots", name: "Dots & Boxes", blurb: "Claim edges. Steal boxes.", mark: "⊞" },
  { id: "rps", name: "RPS Duel", blurb: "Best of five. Simultaneous.", mark: "✊" },
] as const;

export type GameId = (typeof GAMES)[number]["id"];

export function gameById(id: string | null | undefined) {
  return GAMES.find((g) => g.id === id) || null;
}
