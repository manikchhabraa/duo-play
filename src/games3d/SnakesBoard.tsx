import { useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { LADDERS, SNAKES, SIZE, tileRC } from "../shared/snakesBoard.js";
import { snakesTexture } from "./textures";

export const SNAKES_SPAN = SIZE;
const RIM = 1.5;
export const SNAKES_FIT = SNAKES_SPAN + RIM;
const TOP = 0.06;

export function tileWorld(r: number, c: number): [number, number, number] {
  return [c - (SIZE - 1) / 2, TOP, r - (SIZE - 1) / 2];
}

const SNAKE_SKINS = [
  { body: "#3f9e57", belly: "#8fd39a" },
  { body: "#2f8f8a", belly: "#7fd0cb" },
  { body: "#6b5bc7", belly: "#b2a6f0" },
  { body: "#b0497f", belly: "#eba6c6" },
  { body: "#c07b2f", belly: "#f0c489" },
];

function vec(n: number) {
  const { r, c } = tileRC(n);
  const [x, , z] = tileWorld(r, c);
  return new Vector3(x, 0, z);
}

function Snake({ head, tail, skin }: { head: number; tail: number; skin: number }) {
  const paint = SNAKE_SKINS[skin % SNAKE_SKINS.length];
  const { geometry, mouth, facing, tip } = useMemo(() => {
    const a = vec(head);
    const b = vec(tail);
    const direction = new Vector3().subVectors(b, a);
    const length = direction.length();
    const side = new Vector3(-direction.z, 0, direction.x).normalize();
    const points: Vector3[] = [];
    const segments = 12;
    const sway = Math.min(0.85, length * 0.16);
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const point = new Vector3().lerpVectors(a, b, t);
      point.addScaledVector(side, Math.sin(t * Math.PI * 2.2) * sway * (1 - t * 0.3));
      point.y = 0.3 - t * 0.09;
      points.push(point);
    }
    const curve = new CatmullRomCurve3(points);
    const start = points[0];
    const next = points[1];
    return {
      geometry: new TubeGeometry(curve, 110, 0.115, 12, false),
      mouth: [start.x, start.y + 0.03, start.z] as [number, number, number],
      facing: Math.atan2(next.x - start.x, next.z - start.z),
      tip: points[points.length - 1],
    };
  }, [head, tail]);

  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={paint.body} roughness={0.38} metalness={0.12} />
      </mesh>
      <mesh position={[tip.x, tip.y, tip.z]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshStandardMaterial color={paint.body} roughness={0.4} />
      </mesh>
      <group position={mouth} rotation={[0, facing, 0]}>
        <mesh castShadow scale={[1, 0.78, 1.35]}>
          <sphereGeometry args={[0.19, 18, 18]} />
          <meshStandardMaterial color={paint.body} roughness={0.32} metalness={0.14} />
        </mesh>
        {[-0.09, 0.09].map((offset) => (
          <mesh key={offset} position={[offset, 0.09, -0.12]}>
            <sphereGeometry args={[0.042, 10, 10]} />
            <meshStandardMaterial color="#faf6cf" emissive="#4a3c00" emissiveIntensity={0.4} />
          </mesh>
        ))}
        <mesh position={[0, -0.02, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.035, 0.22, 8]} />
          <meshStandardMaterial color="#e2456b" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Ladder({ foot, top }: { foot: number; top: number }) {
  const { position, facing, length, rungs } = useMemo(() => {
    const a = vec(foot);
    const b = vec(top);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const span = Math.hypot(dx, dz) || 0.5;
    return {
      position: [(a.x + b.x) / 2, 0.3, (a.z + b.z) / 2] as [number, number, number],
      facing: Math.atan2(dx, dz),
      length: span,
      rungs: Math.max(3, Math.round(span / 0.6)),
    };
  }, [foot, top]);

  return (
    <group position={position} rotation={[0, facing, 0]}>
      {[-0.22, 0.22].map((offset) => (
        <mesh key={offset} position={[offset, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 0.07, length]} />
          <meshStandardMaterial color="#9c6b34" roughness={0.55} metalness={0.06} />
        </mesh>
      ))}
      {Array.from({ length: rungs }, (_, i) => {
        const z = -length / 2 + ((i + 0.5) / rungs) * length;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.46, 10]} />
            <meshStandardMaterial color="#cf9648" roughness={0.5} metalness={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

export function SnakesBoardMesh() {
  const texture = useMemo(() => snakesTexture(), []);
  const frame = useMemo(() => new RoundedBoxGeometry(SNAKES_FIT, 0.55, SNAKES_FIT, 4, 0.26), []);

  return (
    <group>
      <mesh geometry={frame} position={[0, -0.24, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#6b4527" roughness={0.58} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, 0]} receiveShadow>
        <planeGeometry args={[SNAKES_SPAN, SNAKES_SPAN]} />
        <meshStandardMaterial map={texture} roughness={0.58} metalness={0.02} />
      </mesh>
      {Object.entries(LADDERS).map(([foot, top]) => (
        <Ladder key={`ladder-${foot}`} foot={Number(foot)} top={Number(top)} />
      ))}
      {Object.entries(SNAKES).map(([head, tail], i) => (
        <Snake key={`snake-${head}`} head={Number(head)} tail={Number(tail)} skin={i} />
      ))}
    </group>
  );
}
