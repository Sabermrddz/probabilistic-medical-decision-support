"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D, Quaternion, Vector3, type Group } from "three";

const SPIKES = 36;

/** Procedural virus-like particle: icosahedron core + instanced spikes. No external assets. */
function Virus({ color, spike, scale = 1, position, speed = 0.2 }: { color: string; spike: string; scale?: number; position: [number, number, number]; speed?: number }) {
  const ref = useRef<Group>(null);
  const stems = useRef<InstancedMesh>(null);
  const tips = useRef<InstancedMesh>(null);
  const dirs = useMemo(() => {
    const out: Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < SPIKES; i++) {
      const y = 1 - (i / (SPIKES - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      out.push(new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r));
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const o = new Object3D();
    const q = new Quaternion();
    const up = new Vector3(0, 1, 0);
    dirs.forEach((d, i) => {
      q.setFromUnitVectors(up, d);
      o.quaternion.copy(q);
      o.position.copy(d).multiplyScalar(1.12);
      o.updateMatrix();
      stems.current?.setMatrixAt(i, o.matrix);
      o.position.copy(d).multiplyScalar(1.34);
      o.updateMatrix();
      tips.current?.setMatrixAt(i, o.matrix);
    });
    if (stems.current) stems.current.instanceMatrix.needsUpdate = true;
    if (tips.current) tips.current.instanceMatrix.needsUpdate = true;
  }, [dirs]);

  useFrame((_, dt) => {
    if (ref.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ref.current.rotation.y += dt * speed;
      ref.current.rotation.x += dt * speed * 0.4;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.9}>
      <group ref={ref} position={position} scale={scale}>
        <mesh>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
        </mesh>
        <instancedMesh ref={stems} args={[undefined, undefined, SPIKES]}>
          <cylinderGeometry args={[0.04, 0.06, 0.4, 8]} />
          <meshStandardMaterial color={spike} roughness={0.5} />
        </instancedMesh>
        <instancedMesh ref={tips} args={[undefined, undefined, SPIKES]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color={spike} roughness={0.3} emissive={spike} emissiveIntensity={0.25} />
        </instancedMesh>
      </group>
    </Float>
  );
}

function Rig() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.pointer;
    group.current.rotation.y += (x * 0.35 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-y * 0.2 - group.current.rotation.x) * 0.05;
  });
  return (
    <group ref={group}>
      <Virus color="#0d9488" spike="#5eead4" scale={1.15} position={[0.6, 0, 0]} />
      <Virus color="#2563eb" spike="#93c5fd" scale={0.45} position={[-2.1, 1.2, -1]} speed={0.35} />
      <Virus color="#0284c7" spike="#7dd3fc" scale={0.38} position={[2.9, -1.3, -0.5]} speed={0.3} />
      <Virus color="#0891b2" spike="#a5f3fc" scale={0.3} position={[-1.6, -1.5, 0.6]} speed={0.4} />
      <Virus color="#0d9488" spike="#99f6e4" scale={0.25} position={[3, 1.6, -1.5]} speed={0.25} />
      <Sparkles count={60} scale={[9, 5, 4]} size={3} speed={0.35} color="#14b8a6" opacity={0.7} />
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.5], fov: 45 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 5]} intensity={2.2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#5eead4" />
      <Suspense fallback={null}>
        <Rig />
      </Suspense>
    </Canvas>
  );
}
