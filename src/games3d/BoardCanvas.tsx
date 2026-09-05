import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  camera: [number, number, number];
};

export default function BoardCanvas({ children, camera }: Props) {
  return (
    <Canvas
      className="board3d-canvas"
      dpr={[1, 1.75]}
      camera={{ position: camera, fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ camera: cam }) => {
        cam.lookAt(0, 0, 0);
      }}
    >
      <color attach="background" args={["#0b1220"]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[10, 18, 8]} intensity={1.35} />
      <hemisphereLight args={["#9ad4ff", "#1a1520", 0.35]} />
      {children}
    </Canvas>
  );
}
