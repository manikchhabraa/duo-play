import { useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ludoTexture } from "./textures";

export const LUDO_SPAN = 15;
const RIM = 0.9;
export const LUDO_FIT = LUDO_SPAN + RIM;
const TOP = 0.06;

export function cellWorld(r: number, c: number): [number, number, number] {
  return [c - 7, TOP, r - 7];
}

export function LudoBoardMesh() {
  const texture = useMemo(() => ludoTexture(), []);
  const frame = useMemo(() => new RoundedBoxGeometry(LUDO_FIT, 0.6, LUDO_FIT, 4, 0.26), []);

  return (
    <group>
      <mesh geometry={frame} position={[0, -0.26, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#6b4527" roughness={0.58} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, 0]} receiveShadow>
        <planeGeometry args={[LUDO_SPAN, LUDO_SPAN]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.02} />
      </mesh>
    </group>
  );
}
