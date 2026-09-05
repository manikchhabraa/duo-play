import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/** Face normals for a standard die: opposite faces sum to seven. */
const FACE_NORMAL: Record<number, [number, number, number]> = {
  1: [0, 1, 0],
  2: [0, 0, 1],
  3: [1, 0, 0],
  4: [-1, 0, 0],
  5: [0, 0, -1],
  6: [0, -1, 0],
};

const PIP_GRID: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

const UP = new Vector3(0, 1, 0);
const SPREAD = 0.25;
const SURFACE = 0.47;

type Pip = { key: string; position: [number, number, number] };

function buildPips(): Pip[] {
  const pips: Pip[] = [];
  for (const [face, normal] of Object.entries(FACE_NORMAL)) {
    const n = new Vector3(...normal);
    const u = new Vector3(0, 1, 0).cross(n);
    if (u.lengthSq() < 0.001) u.set(1, 0, 0);
    u.normalize();
    const v = new Vector3().crossVectors(n, u).normalize();
    for (const [a, b] of PIP_GRID[Number(face)]) {
      const point = n
        .clone()
        .multiplyScalar(SURFACE)
        .addScaledVector(u, a * SPREAD)
        .addScaledVector(v, b * SPREAD);
      pips.push({ key: `${face}-${a}-${b}`, position: [point.x, point.y, point.z] });
    }
  }
  return pips;
}

type Props = {
  value: number;
  spinning: boolean;
  position: [number, number, number];
  scale?: number;
};

export default function DiceMesh({ value, spinning, position, scale = 1 }: Props) {
  const group = useRef<Group>(null);
  const clock = useRef(0);
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 5, 0.16), []);
  const pips = useMemo(() => buildPips(), []);

  const resting = useMemo(() => {
    const normal = new Vector3(...(FACE_NORMAL[value] || FACE_NORMAL[1]));
    const align = new Quaternion().setFromUnitVectors(normal, UP);
    const yaw = new Quaternion().setFromAxisAngle(UP, 0.24);
    return yaw.multiply(align);
  }, [value]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const dt = Math.min(delta, 0.05);

    if (spinning) {
      clock.current += dt;
      node.rotateX(dt * 11);
      node.rotateY(dt * 15);
      node.rotateZ(dt * 8);
      node.position.y = position[1] + Math.abs(Math.sin(clock.current * 8)) * 0.55;
      return;
    }

    clock.current = 0;
    node.quaternion.slerp(resting, Math.min(1, dt * 9));
    node.position.y += (position[1] - node.position.y) * Math.min(1, dt * 9);
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#fbf7ec" roughness={0.28} metalness={0.05} />
      </mesh>
      {pips.map((pip) => (
        <mesh key={pip.key} position={pip.position}>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial color="#1b1a19" roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}
