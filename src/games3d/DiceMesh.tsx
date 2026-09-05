import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const FACE: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, 0, -Math.PI / 2],
  3: [Math.PI / 2, 0, 0],
  4: [-Math.PI / 2, 0, 0],
  5: [0, 0, Math.PI / 2],
  6: [Math.PI, 0, 0],
};

type Props = {
  value: number;
  spinning: boolean;
  position?: [number, number, number];
};

export default function DiceMesh({ value, spinning, position = [0, 1.2, 0] }: Props) {
  const ref = useRef<Group>(null);
  const target = useMemo(() => FACE[value] || FACE[1], [value]);

  useEffect(() => {
    if (!ref.current || spinning) return;
    ref.current.rotation.set(target[0], target[1], target[2]);
  }, [target, spinning]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    if (spinning) {
      g.rotation.x += dt * 14;
      g.rotation.y += dt * 11;
      g.rotation.z += dt * 8;
      return;
    }
    g.rotation.x += (target[0] - g.rotation.x) * Math.min(1, dt * 10);
    g.rotation.y += (target[1] - g.rotation.y) * Math.min(1, dt * 10);
    g.rotation.z += (target[2] - g.rotation.z) * Math.min(1, dt * 10);
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f4f5f7" roughness={0.35} />
      </mesh>
      <Dots face="1" />
      <Dots face="2" />
      <Dots face="3" />
      <Dots face="4" />
      <Dots face="5" />
      <Dots face="6" />
    </group>
  );
}

const DOT = 0.09;

function Dots({ face }: { face: string }) {
  const pips: [number, number][] =
    face === "1"
      ? [[0, 0]]
      : face === "2"
        ? [[-0.22, -0.22], [0.22, 0.22]]
        : face === "3"
          ? [[-0.22, -0.22], [0, 0], [0.22, 0.22]]
          : face === "4"
            ? [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]
            : face === "5"
              ? [[-0.22, -0.22], [0.22, -0.22], [0, 0], [-0.22, 0.22], [0.22, 0.22]]
              : [
                  [-0.22, -0.28],
                  [0.22, -0.28],
                  [-0.22, 0],
                  [0.22, 0],
                  [-0.22, 0.28],
                  [0.22, 0.28],
                ];

  const transform =
    face === "1"
      ? { position: [0, 0.52, 0] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number] }
      : face === "6"
        ? { position: [0, -0.52, 0] as [number, number, number], rotation: [Math.PI / 2, 0, 0] as [number, number, number] }
        : face === "2"
          ? { position: [0.52, 0, 0] as [number, number, number], rotation: [0, Math.PI / 2, 0] as [number, number, number] }
          : face === "5"
            ? { position: [-0.52, 0, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] }
            : face === "3"
              ? { position: [0, 0, 0.52] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] }
              : { position: [0, 0, -0.52] as [number, number, number], rotation: [0, Math.PI, 0] as [number, number, number] };

  return (
    <group position={transform.position} rotation={transform.rotation}>
      {pips.map((pip, i) => (
        <mesh key={i} position={[pip[0], pip[1], 0.01]}>
          <circleGeometry args={[DOT, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
}
