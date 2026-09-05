import { useMemo } from "react";
import { COLORS, MAIN_PATH, SAFE_MAIN, STRETCH } from "../shared/ludoBoard.js";

export function cellWorld(r: number, c: number): [number, number, number] {
  return [c - 7, 0.12, r - 7];
}

const pathSet = new Set(MAIN_PATH.map(([r, c]: number[]) => `${r},${c}`));

function colorFor(r: number, c: number) {
  if (r <= 5 && c <= 5) return "#b43232";
  if (r >= 9 && c >= 9) return "#d4a017";
  if (r <= 5 && c >= 9) return "#1e7a45";
  if (r >= 9 && c <= 5) return "#1f5fad";
  if (r === 7 && c === 6) return COLORS[0];
  if (r === 7 && c === 8) return COLORS[1];
  if (r === 7 && c === 7) return "#f4f0e4";
  for (const [r0, c0] of STRETCH[0]) if (r === r0 && c === c0) return "#e07070";
  for (const [r0, c0] of STRETCH[1]) if (r === r0 && c === c0) return "#f3d36a";
  if (pathSet.has(`${r},${c}`)) {
    const idx = MAIN_PATH.findIndex(([rr, cc]: number[]) => rr === r && cc === c);
    if (SAFE_MAIN.includes(idx)) return "#f6e7a2";
    return "#efe6d4";
  }
  return "#16301f";
}

export function LudoTiles() {
  const tiles = useMemo(() => {
    const list = [];
    for (let r = 0; r < 15; r += 1) {
      for (let c = 0; c < 15; c += 1) {
        list.push({ r, c, color: colorFor(r, c) });
      }
    }
    return list;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#0e1a12" />
      </mesh>
      {tiles.map((t) => (
        <mesh
          key={`${t.r}-${t.c}`}
          position={[t.c - 7, 0, t.r - 7]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.92, 0.92]} />
          <meshStandardMaterial color={t.color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export function Pawn({
  color,
  position,
  glow,
  onClick,
}: {
  color: string;
  position: [number, number, number];
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.22, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} emissive={glow ? color : "#000"} emissiveIntensity={glow ? 0.45 : 0} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} emissive={glow ? "#fff" : "#000"} emissiveIntensity={glow ? 0.2 : 0} />
      </mesh>
    </group>
  );
}
