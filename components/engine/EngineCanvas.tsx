"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls, Environment, Grid, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";

export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} />
      <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#9ec5ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={2} color="#ffd2a8" position={[-6, 2, 3]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#a8ccff" position={[6, 2, -3]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 3, 8]} scale={3} />
      </Environment>
    </>
  );
}

export function Floor({ y = -1.3 }: { y?: number }) {
  return (
    <Grid
      position={[0, y, 0]}
      args={[30, 30]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#2a3342"
      sectionSize={2.5}
      sectionThickness={1}
      sectionColor="#3b4a60"
      fadeDistance={22}
      fadeStrength={1.5}
      infiniteGrid
    />
  );
}

/** Canvas preconfigured for the engine scenes (clipping, tone mapping, bloom). */
export function EngineCanvas({
  children,
  camera = [5.6, 3.6, 7.2],
  fov = 38,
  bloom = true,
  onPointerMissed,
}: {
  children: ReactNode;
  camera?: [number, number, number];
  fov?: number;
  bloom?: boolean;
  onPointerMissed?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: camera, fov, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      onPointerMissed={onPointerMissed}
    >
      <color attach="background" args={["#0a0e14"]} />
      <fog attach="fog" args={["#0a0e14", 14, 30]} />
      <Suspense fallback={null}>
        <StudioLights />
        {children}
      </Suspense>
      {bloom && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={1} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Camera controls that fly to a named object when `focus` changes. */
export function FocusControls({
  focus,
  resetToken,
  home,
  target,
  autoRotate = false,
}: {
  focus: string | null;
  resetToken: number;
  home: [number, number, number];
  target: [number, number, number];
  autoRotate?: boolean;
}) {
  const ref = useRef<CameraControls>(null);
  const scene = useThree((s) => s.scene);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  // Portrait screens need the camera further back to fit the same content.
  const fit = Math.max(1, 1.25 / aspect);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!focus) {
      const t = new THREE.Vector3(...target);
      const p = new THREE.Vector3(...home).sub(t).multiplyScalar(fit).add(t);
      c.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, true);
      return;
    }
    const obj = scene.getObjectByName(focus);
    if (!obj) return;
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const dist = Math.max(2.2, size * 1.25) * fit;
    const dir = new THREE.Vector3(0.55, 0.45, 1).normalize();
    const pos = center.clone().addScaledVector(dir, dist);
    c.setLookAt(pos.x, pos.y, pos.z, center.x, center.y, center.z, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, resetToken, scene, fit, home, target]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !autoRotate) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      c.azimuthAngle += ((t - last) / 1000) * 0.15;
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={1.2}
      maxDistance={24}
      smoothTime={0.45}
      dollySpeed={0.6}
    />
  );
}
