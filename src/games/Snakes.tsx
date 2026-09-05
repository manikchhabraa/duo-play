import { useEffect, useMemo, useState } from "react";
import { SNAKES, LADDERS, tileRC, SIZE } from "../shared/snakesBoard.js";
import { buzz } from "../util";
import BoardCanvas from "../games3d/BoardCanvas";
import DiceMesh from "../games3d/DiceMesh";

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

const P0 = "#e23d3d";
const P1 = "#3de7ff";

function world(r: number, c: number): [number, number, number] {
  return [c - (SIZE - 1) / 2, 0.28, r - (SIZE - 1) / 2];
}

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
    }, 95);
    return () => window.clearInterval(timer);
  }, [game.seq, game.anim, game.tokens]);

  return (
    <div className="board3d">
      <div className="board3d-stage">
        <BoardCanvas camera={[0, 13, 12]}>
          <SnakesTiles />
          {display.map((t) => {
            const [x, y, z] = world(t.r, t.c);
            const bump = t.player === 0 ? -0.12 : 0.12;
            return (
              <mesh key={t.player} position={[x + bump, y, z]} castShadow>
                <sphereGeometry args={[0.28, 18, 18]} />
                <meshStandardMaterial color={t.player === 0 ? P0 : P1} roughness={0.35} />
              </mesh>
            );
          })}
          <DiceMesh value={game.dice || 1} spinning={spinning} position={[0, 1.4, 0]} />
        </BoardCanvas>
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

function SnakesTiles() {
  const tiles = useMemo(() => {
    const list = [];
    for (let n = 1; n <= 100; n += 1) {
      const { r, c } = tileRC(n);
      const light = (r + c) % 2 === 0;
      list.push({ n, r, c, color: light ? "#efe6d4" : "#c9b48a" });
    }
    return list;
  }, []);

  const ladders = Object.entries(LADDERS).map(([a, b]) => ({
    from: tileRC(Number(a)),
    to: tileRC(Number(b)),
  }));
  const snakes = Object.entries(SNAKES).map(([a, b]) => ({
    from: tileRC(Number(a)),
    to: tileRC(Number(b)),
  }));

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#102018" />
      </mesh>
      {tiles.map((t) => (
        <mesh
          key={t.n}
          position={[t.c - 4.5, 0, t.r - 4.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.92, 0.92]} />
          <meshStandardMaterial color={t.n === 100 ? "#c8f542" : t.color} />
        </mesh>
      ))}
      {ladders.map((l, i) => (
        <Rail key={`l${i}`} from={l.from} to={l.to} color="#8b5a2b" />
      ))}
      {snakes.map((s, i) => (
        <Rail key={`s${i}`} from={s.from} to={s.to} color="#1f9d58" />
      ))}
    </group>
  );
}

function Rail({
  from,
  to,
  color,
}: {
  from: { r: number; c: number };
  to: { r: number; c: number };
  color: string;
}) {
  const a = world(from.r, from.c);
  const b = world(to.r, to.c);
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, 0.22, (a[2] + b[2]) / 2];
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const len = Math.hypot(dx, dz) || 0.2;
  const rot = Math.atan2(dx, dz);
  return (
    <mesh position={mid} rotation={[0, rot, 0.18]}>
      <boxGeometry args={[0.12, 0.08, len]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
