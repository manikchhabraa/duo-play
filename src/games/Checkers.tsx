import { useMemo, useState } from "react";
import { buzz } from "../util";

type Piece = { player: number; king: boolean } | null;
type Move = { from: number[]; to: number[]; capture: number[] | null };

type Props = {
  game: {
    board: Piece[][];
    turn: number;
    winner: number | "draw" | null;
    chain: number[] | null;
    legal: Move[];
  };
  you: number;
  onMove: (from: number[], to: number[]) => void;
};

export default function Checkers({ game, you, onMove }: Props) {
  const locked = game.chain;
  const [picked, setPicked] = useState<string | null>(null);
  const yourTurn = game.winner === null && game.turn === you;

  const selected = locked ? `${locked[0]},${locked[1]}` : picked;
  const targets = useMemo(() => {
    if (!selected) return new Set<string>();
    const [r, c] = selected.split(",").map(Number);
    return new Set(
      game.legal
        .filter((m) => m.from[0] === r && m.from[1] === c)
        .map((m) => `${m.to[0]},${m.to[1]}`)
    );
  }, [game.legal, selected]);

  return (
    <div className="ck">
      {game.board.map((row, r) =>
        row.map((cell, c) => {
          const dark = (r + c) % 2 === 1;
          const key = `${r},${c}`;
          const canPick =
            yourTurn &&
            dark &&
            cell?.player === you &&
            game.legal.some((m) => m.from[0] === r && m.from[1] === c);
          const isTarget = targets.has(key);
          return (
            <button
              key={key}
              type="button"
              className={`ck-sq ${dark ? "dark" : "light"}${selected === key ? " sel" : ""}${isTarget ? " tgt" : ""}`}
              onClick={() => {
                if (isTarget && selected) {
                  const [sr, sc] = selected.split(",").map(Number);
                  buzz();
                  onMove([sr, sc], [r, c]);
                  setPicked(null);
                  return;
                }
                if (canPick && !locked) setPicked(key);
              }}
            >
              {cell && (
                <span className={`ck-man p${cell.player}${cell.king ? " king" : ""}`} />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
