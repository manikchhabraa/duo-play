import { useEffect, useRef, useState } from "react";
import { COLORS } from "../shared/ludoBoard.js";
import { buzz } from "../util";
import BoardCanvas from "../games3d/BoardCanvas";
import DiceMesh from "../games3d/DiceMesh";
import Pawn from "../games3d/Pieces";
import { LUDO_FIT, LudoBoardMesh, cellWorld } from "../games3d/LudoBoard";

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

/** The dice rests in the unused blue base and hops while rolling. */
const DICE_SEAT: [number, number, number] = [-4.5, 0.76, 4.5];
const DICE_HEADROOM: [number, number, number][] = [[-4.5, 2.1, 5.3]];

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
    }, 130);
    return () => window.clearInterval(timer);
  }, [game.seq, game.anim, game.tokens]);

  return (
    <div className="board3d">
      <div className="board3d-stage">
        <BoardCanvas fit={LUDO_FIT} tilt={1.06} keepInView={DICE_HEADROOM}>
          <LudoBoardMesh />
          {display.map((t) => {
            const [x, y, z] = cellWorld(t.r, t.c);
            return (
              <Pawn
                key={`${t.player}-${t.token}`}
                color={COLORS[t.player]}
                position={[x, y, z]}
                glow={t.canMove && yourTurn}
                onSelect={
                  t.canMove && yourTurn
                    ? () => {
                        buzz();
                        onAction({ type: "move", token: t.token });
                      }
                    : undefined
                }
              />
            );
          })}
          <DiceMesh
            value={game.dice || 1}
            spinning={spinning}
            position={DICE_SEAT}
            scale={1.4}
          />
        </BoardCanvas>
      </div>

      <div className="board3d-legend">
        <span>
          <i style={{ background: COLORS[you] }} />
          You
        </span>
        <span>
          <i style={{ background: COLORS[1 - you] }} />
          Them
        </span>
        <em>{game.dice ? `Dice ${game.dice}` : "Dice —"}</em>
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
        {game.phase === "move" && yourTurn ? "Tap a glowing token" : "Roll dice"}
      </button>
    </div>
  );
}
