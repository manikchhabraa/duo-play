import { useEffect, useMemo, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Vector3, type PerspectiveCamera } from "three";
import { glowTexture } from "./textures";

type Point = [number, number, number];

type Props = {
  children: ReactNode;
  /** Footprint of the board in world units, including its frame. */
  fit: number;
  /** Camera pitch in radians. Higher is closer to a top-down view. */
  tilt?: number;
  /** Extra world points that must stay on screen, e.g. the top of the dice. */
  keepInView?: Point[];
};

const TARGET = 0.97;

function FrameBoard({
  fit,
  tilt,
  keepInView,
}: {
  fit: number;
  tilt: number;
  keepInView: Point[];
}) {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  const corners = useMemo(() => {
    const half = fit / 2;
    const points: Vector3[] = [];
    for (const x of [-half, half]) {
      for (const z of [-half, half]) points.push(new Vector3(x, 0, z));
    }
    for (const [x, y, z] of keepInView) points.push(new Vector3(x, y, z));
    return points;
  }, [fit, keepInView]);

  useEffect(() => {
    const cam = camera as PerspectiveCamera;
    cam.aspect = width / Math.max(1, height);
    const halfFov = ((cam.fov * Math.PI) / 180) / 2;

    let distance = fit * 1.4;
    let focus = 0;

    // Solve for the distance and look-at point that just contain the board,
    // since a tilted board projects asymmetrically and trig alone under-fits it.
    for (let pass = 0; pass < 30; pass += 1) {
      cam.position.set(0, Math.sin(tilt) * distance, Math.cos(tilt) * distance + focus);
      cam.lookAt(0, 0, focus);
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld(true);

      let extent = 0;
      let lowest = Infinity;
      let highest = -Infinity;
      for (const corner of corners) {
        const ndc = corner.clone().project(cam);
        extent = Math.max(extent, Math.abs(ndc.x), Math.abs(ndc.y));
        lowest = Math.min(lowest, ndc.y);
        highest = Math.max(highest, ndc.y);
      }

      const drift = (highest + lowest) / 2;
      const worldPerNdc = distance * Math.tan(halfFov);
      if (Math.abs(extent - TARGET) < 0.004 && Math.abs(drift) < 0.006) break;
      distance *= 1 + (extent - TARGET) * 0.7;
      focus -= drift * worldPerNdc * 0.5;
    }
  }, [camera, corners, width, height, fit, tilt]);

  return null;
}

function Glow({ fit }: { fit: number }) {
  const texture = useMemo(() => glowTexture(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
      <planeGeometry args={[fit * 1.9, fit * 1.9]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

const NO_EXTRAS: Point[] = [];

export default function BoardCanvas({
  children,
  fit,
  tilt = 0.95,
  keepInView = NO_EXTRAS,
}: Props) {
  const reach = fit * 0.8;
  return (
    <Canvas
      className="board3d-canvas"
      shadows
      dpr={[1, 2]}
      camera={{ fov: 34, near: 0.5, far: 300 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#080c15"]} />
      <FrameBoard fit={fit} tilt={tilt} keepInView={keepInView} />
      <Glow fit={fit} />

      <hemisphereLight args={["#fff4e2", "#2a2233", 0.75]} />
      <directionalLight
        castShadow
        position={[fit * 0.4, fit * 1.1, fit * 0.55]}
        intensity={1.85}
        color="#fff6e8"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0008}
        shadow-camera-near={1}
        shadow-camera-far={fit * 4}
        shadow-camera-left={-reach}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-camera-bottom={-reach}
      />
      <directionalLight position={[-fit * 0.5, fit * 0.45, -fit * 0.35]} intensity={0.5} color="#cfe0ff" />

      {children}
    </Canvas>
  );
}
