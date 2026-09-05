import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { LatheGeometry, Vector2, Vector3, type Group, type Mesh } from "three";

/** Turned-wood silhouette so tokens read as real board-game pawns. */
const PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.3, 0.0],
  [0.3, 0.05],
  [0.21, 0.1],
  [0.13, 0.26],
  [0.2, 0.35],
  [0.15, 0.42],
  [0.1, 0.47],
  [0.08, 0.51],
];

const target = new Vector3();

type Props = {
  color: string;
  position: [number, number, number];
  glow?: boolean;
  scale?: number;
  onSelect?: () => void;
};

export default function Pawn({ color, position, glow, scale = 1, onSelect }: Props) {
  const group = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const current = useRef(new Vector3(...position));
  const pulse = useRef(0);

  const body = useMemo(
    () => new LatheGeometry(PROFILE.map(([x, y]) => new Vector2(x, y)), 28),
    []
  );

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const dt = Math.min(delta, 0.05);

    target.set(position[0], position[1], position[2]);
    const gap = current.current.distanceTo(target);
    if (gap > 0.002) {
      current.current.lerp(target, Math.min(1, dt * 11));
      node.position.copy(current.current);
      // Lift the pawn mid-stride so hops read as movement, not sliding.
      node.position.y += Math.min(gap, 1) * 0.45;
    } else {
      current.current.copy(target);
      node.position.copy(target);
    }

    if (ring.current) {
      pulse.current += dt * 3.4;
      const beat = 1 + Math.sin(pulse.current) * 0.09;
      ring.current.scale.set(beat, beat, 1);
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {glow && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.31, 0.42, 28]} />
          <meshBasicMaterial color="#f6ffd6" transparent opacity={0.85} />
        </mesh>
      )}
      {onSelect && (
        // Invisible collar so a thumb-sized tap still lands on the pawn.
        <mesh
          position={[0, 0.42, 0]}
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelect();
          }}
        >
          <cylinderGeometry args={[0.48, 0.48, 1, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.16} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={color} roughness={0.26} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.66, 0.055]} scale={[1, 1, 0.6]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} opacity={0.35} transparent />
      </mesh>
    </group>
  );
}
