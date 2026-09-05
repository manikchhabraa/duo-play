import { useEffect, useState } from "react";
import { tileRC } from "../shared/snakesBoard.js";
import { buzz } from "../util";
import BoardCanvas from "../games3d/BoardCanvas";
import DiceMesh from "../games3d/DiceMesh";
import Pawn from "../games3d/Pieces";
import { SNAKES_FIT, SnakesBoardMesh, tileWorld } from "../games3d/SnakesBoard";

type Anim = {
  player: number;
  steps: number[];
  warp: { from: number; to: number; snake?: boolean; ladder?: boolean } | null;
  dice: number;
} | null;

type Props = {
  game: {
    turn: number;
    dice: number;
    winner: number | null;
    last: { text: string; by: number | null } | null;
    anim: Anim;
    tokens: { player: number; n: number; r: number; c: number }[];
    seq: number;
    prompt: string;
  };
  you: number;
  onAction: (action: Record<string, unknown>) => void;
};

const PAINT = ["#e2453f", "#31c3e8"];

/** The dice rests on the board frame, clear of all 100 tiles. */
const DICE_SEAT: [number, number, number] = [5.3, 0.63, 5.3];
const DICE_HEADROOM: [number, number, number][] = [[6.05, 1.7, 6.05]];

export default function Snakes({ game, you, onAction }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState(game.tokens);
  const yourTurn = game.turn === you && game.winner === null;

  useEffect(() => {
    setSpinning(false);
  }, [game.seq]);

  useEffect(() => {
    const anim = game.anim;
    if (!anim?.steps?.length) {
      setDisplay(game.tokens);
      return;
    }
    const path = anim.steps.slice();
    if (anim.warp) path.push(anim.warp.to);
    let i = 0;
    const timer = window.setInterval(() => {
      const n = path[i];
      if (n == null) {
        window.clearInterval(timer);
        setDisplay(game.tokens);
        return;
      }
      const rc = tileRC(n);
      setDisplay((cur) =>
        cur.map((t) => (t.player === anim.player ? { ...t, n, r: rc.r, c: rc.c } : t))
      );
      i += 1;
    }, 120);
    return () => window.clearInterval(timer);
  }, [game.seq, game.anim, game.tokens]);

  return (
    <div className="board3d">
      <div className="board3d-stage">
        <BoardCanvas fit={SNAKES_FIT} tilt={1.04} keepInView={DICE_HEADROOM}>
          <SnakesBoardMesh />
          {display.map((t) => {
            const [x, y, z] = tileWorld(t.r, t.c);
            const lane = t.player === 0 ? -0.18 : 0.18;
            return (
              <Pawn
                key={t.player}
                color={PAINT[t.player]}
                position={[x + lane, y, z]}
                scale={0.92}
              />
            );
          })}
          <DiceMesh
            value={game.dice || 1}
            spinning={spinning}
            position={DICE_SEAT}
            scale={1.1}
          />
        </BoardCanvas>
      </div>

      <div className="board3d-legend">
        <span>
          <i style={{ background: PAINT[you] }} />
          You · {game.tokens.find((t) => t.player === you)?.n ?? 0}
        </span>
        <span>
          <i style={{ background: PAINT[1 - you] }} />
          Them · {game.tokens.find((t) => t.player !== you)?.n ?? 0}
        </span>
        <em>{game.dice ? `Dice ${game.dice}` : "Dice —"}</em>
      </div>

      <p className="uno-log">{game.last?.text}</p>
      <button
        type="button"
        className="btn"
        disabled={!yourTurn || spinning}
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
