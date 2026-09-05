import { useEffect, useRef, useState } from "react";
import { COLORS } from "../shared/ludoBoard.js";
import { buzz } from "../util";
import BoardCanvas from "../games3d/BoardCanvas";
import DiceMesh from "../games3d/DiceMesh";
import { LudoTiles, Pawn, cellWorld } from "../games3d/LudoBoard";

type Token = {
  player: number;
  token: number;
  r: number;
  c: number;
  canMove: boolean;
};

type Anim = {
  player: number;
  token: number;
  cells: number[][];
  captured: { player: number; token: number } | null;
} | null;

type Props = {
  game: {
    turn: number;
    phase: "roll" | "move" | "over";
    dice: number;
    winner: number | null;
    last: { text: string; by: number | null } | null;
    anim: Anim;
    tokens: Token[];
    seq: number;
    prompt: string;
  };
  you: number;
  onAction: (action: Record<string, unknown>) => void;
};

export default function Ludo({ game, you, onAction }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<Token[]>(game.tokens);
  const animating = useRef(false);
  const yourTurn = game.turn === you && game.winner === null;

  useEffect(() => {
    setSpinning(false);
  }, [game.seq]);

  useEffect(() => {
    const anim = game.anim;
    if (!anim?.cells?.length) {
      if (!animating.current) setDisplay(game.tokens);
      return;
    }
    animating.current = true;
    let i = 0;
    const timer = window.setInterval(() => {
      const cell = anim.cells[i];
      if (!cell) {
        window.clearInterval(timer);
        animating.current = false;
        setDisplay(game.tokens);
        return;
      }
      setDisplay((cur) =>
        cur.map((t) =>
          t.player === anim.player && t.token === anim.token
            ? { ...t, r: cell[0], c: cell[1] }
            : t
        )
      );
      i += 1;
    }, 110);
    return () => window.clearInterval(timer);
  }, [game.seq, game.anim, game.tokens]);

  return (
    <div className="board3d">
      <div className="board3d-stage">
        <BoardCanvas camera={[0, 16, 14]}>
          <LudoTiles />
          {display.map((t) => {
            const [x, y, z] = cellWorld(t.r, t.c);
            return (
              <Pawn
                key={`${t.player}-${t.token}`}
                color={COLORS[t.player]}
                position={[x, y, z]}
                glow={t.canMove && yourTurn}
                onClick={() => {
                  if (!t.canMove || !yourTurn) return;
                  buzz();
                  onAction({ type: "move", token: t.token });
                }}
              />
            );
          })}
          <DiceMesh
            value={game.dice || 1}
            spinning={spinning}
            position={[0, 1.35, 0]}
          />
        </BoardCanvas>
      </div>
      <p className="uno-log">{game.last?.text}</p>
      <button
        type="button"
        className="btn"
        disabled={!yourTurn || game.phase !== "roll" || spinning}
        onClick={() => {
          buzz(16);
          setSpinning(true);
          onAction({ type: "roll" });
        }}
      >
        Roll dice
      </button>
    </div>
  );
}
