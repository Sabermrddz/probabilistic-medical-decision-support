"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useRef, useState, type ReactNode } from "react";
import type { Group } from "three";
import type { BodyRegion } from "@/lib/inference";

interface Props {
  region: BodyRegion | null;
  onSelect: (r: BodyRegion | null) => void;
}

const BASE = "#6fa8b8";
const ACTIVE = "#14b8a6";

function Part({
  id,
  region,
  onSelect,
  position,
  scale,
  children,
}: {
  id: BodyRegion;
  region: BodyRegion | null;
  onSelect: Props["onSelect"];
  position: [number, number, number];
  scale?: [number, number, number];
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  const selected = region === id;
  return (
    <mesh
      position={position}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(selected ? null : id);
      }}
    >
      {children}
      <meshStandardMaterial
        color={selected ? ACTIVE : BASE}
        emissive={ACTIVE}
        emissiveIntensity={selected ? 0.7 : hover ? 0.35 : 0}
        roughness={0.45}
        metalness={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function Body({ region, onSelect }: Props) {
  const group = useRef<Group>(null);
  const hovering = useRef(false);
  useFrame((_, dt) => {
    if (group.current && !hovering.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) group.current.rotation.y += dt * 0.5;
  });
  const p = { region, onSelect };
  return (
    <group ref={group} position={[0, -0.25, 0]} onPointerOver={() => (hovering.current = true)} onPointerOut={() => (hovering.current = false)}>
      <Part id="head" {...p} position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
      </Part>
      <Part id="throat" {...p} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.24, 20]} />
      </Part>
      <Part id="chest" {...p} position={[0, 0.88, 0]} scale={[1, 1, 0.62]}>
        <capsuleGeometry args={[0.31, 0.3, 8, 24]} />
      </Part>
      <Part id="abdomen" {...p} position={[0, 0.3, 0]} scale={[1, 1, 0.62]}>
        <capsuleGeometry args={[0.27, 0.3, 8, 24]} />
      </Part>
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <Part id="body" {...p} position={[s * 0.52, 0.8, 0]}>
            <capsuleGeometry args={[0.08, 0.75, 6, 12]} />
          </Part>
          <Part id="body" {...p} position={[s * 0.15, -0.65, 0]}>
            <capsuleGeometry args={[0.12, 1.0, 6, 14]} />
          </Part>
        </group>
      ))}
    </group>
  );
}

export default function BodySelector({ region, onSelect }: Props) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0.4, 5.2], fov: 32 }} gl={{ alpha: true, antialias: true }} onPointerMissed={() => undefined}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} />
      <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#9ad8ff" />
      <Body region={region} onSelect={onSelect} />
    </Canvas>
  );
}
