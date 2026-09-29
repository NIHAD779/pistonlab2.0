"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  BORE_R,
  CRANK_R,
  CROWN_OFFSET,
  DECK_Y,
  DEG,
  EXHAUST_PEAK,
  INTAKE_PEAK,
  ROD_L,
  SKIRT_OFFSET,
  SPARK_DEG,
  VALVE_MAX_LIFT,
  clamp01,
  combustionGlow,
  exhaustLift,
  gasColor,
  intakeLift,
  mod,
  pinHeight,
  smoothstep,
  sparkOn,
} from "@/lib/engineMath";
import { cycleClock, useCycle } from "./cycleStore";

const CAM_Y = 2.9;
const VX = 0.2; // valve x offset
const LIFT = VALVE_MAX_LIFT * 1.6;

const metal = (color: string, roughness = 0.3, metalness = 0.85) => (
  <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
);

function useCurves() {
  return useMemo(() => {
    const intake = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.9, 2.55, 0),
      new THREE.Vector3(-1.0, 2.5, 0),
      new THREE.Vector3(-0.45, 2.35, 0),
      new THREE.Vector3(-VX, 2.1, 0),
    ]);
    const exhaust = new THREE.CatmullRomCurve3([
      new THREE.Vector3(VX, 2.1, 0),
      new THREE.Vector3(0.45, 2.35, 0),
      new THREE.Vector3(1.0, 2.5, 0),
      new THREE.Vector3(1.9, 2.55, 0),
    ]);
    return { intake, exhaust };
  }, []);
}

function lobeGeometry() {
  const pts: THREE.Vector2[] = [];
  const n = 64;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.09 + 0.1 * Math.pow(Math.max(0, Math.cos(a - Math.PI / 2)), 3);
    pts.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.14, bevelEnabled: false });
  g.translate(0, 0, -0.07);
  return g;
}

function webGeometry() {
  const s = new THREE.Shape();
  const pr = 0.15;
  const cw = 0.5;
  s.moveTo(-pr, CRANK_R);
  s.absarc(0, CRANK_R, pr, Math.PI, 0, true);
  s.lineTo(pr, 0);
  s.lineTo(cw * Math.cos(-25 * DEG), cw * Math.sin(-25 * DEG));
  s.absarc(0, 0, cw, -25 * DEG, -155 * DEG, true);
  s.lineTo(-pr, 0);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  g.translate(0, 0, -0.045);
  return g;
}

function Label({ position, children }: { position: [number, number, number]; children: string }) {
  const show = useCycle((s) => s.labels);
  if (!show) return null;
  return (
    <Html position={position} center zIndexRange={[10, 0]}>
      <div className="label3d">{children}</div>
    </Html>
  );
}

/* ---------------------------------------------------------------- */

function Mechanism() {
  const crank = useRef<THREE.Group>(null);
  const rod = useRef<THREE.Group>(null);
  const piston = useRef<THREE.Group>(null);
  const web = useMemo(webGeometry, []);
  useFrame(() => {
    const c = cycleClock.angle;
    const t = mod(c, 360) * DEG;
    const px = CRANK_R * Math.sin(t);
    const py = CRANK_R * Math.cos(t);
    const y = pinHeight(mod(c, 360));
    if (crank.current) crank.current.rotation.z = -t;
    if (rod.current) {
      rod.current.position.set(px, py, 0);
      rod.current.rotation.z = Math.atan2(px, y - py);
    }
    if (piston.current) piston.current.position.y = y;
  });
  return (
    <group>
      <group ref={crank}>
        <mesh geometry={web} position={[0, 0, 0.14]}>{metal("#7a818b", 0.25, 0.9)}</mesh>
        <mesh geometry={web} position={[0, 0, -0.14]}>{metal("#7a818b", 0.25, 0.9)}</mesh>
        <mesh position={[0, CRANK_R, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.3, 24]} />
          {metal("#b3b9c2", 0.15, 0.95)}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 1.3, 24]} />
          {metal("#7a818b", 0.25, 0.9)}
        </mesh>
        <mesh position={[0, 0, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.06, 48]} />
          {metal("#4e545c", 0.35, 0.85)}
        </mesh>
        <mesh position={[0, 0.4, -0.58]}>
          <boxGeometry args={[0.06, 0.2, 0.02]} />
          <meshStandardMaterial color="#ff7a1a" />
        </mesh>
      </group>
      <group ref={rod}>
        <mesh position={[0, ROD_L / 2, 0]}>
          <boxGeometry args={[0.1, ROD_L - 0.2, 0.07]} />
          {metal("#8c939d")}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.12, 28]} />
          {metal("#8c939d")}
        </mesh>
        <mesh position={[0, ROD_L, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 20]} />
          {metal("#8c939d")}
        </mesh>
      </group>
      <group ref={piston}>
        <mesh position={[0, CROWN_OFFSET - 0.09, 0]}>
          <cylinderGeometry args={[BORE_R - 0.012, BORE_R - 0.012, 0.18, 40]} />
          {metal("#d7dade", 0.3, 0.7)}
        </mesh>
        {[0.035, 0.085, 0.14].map((d) => (
          <mesh key={d} position={[0, CROWN_OFFSET - d, 0]}>
            <cylinderGeometry args={[BORE_R - 0.004, BORE_R - 0.004, 0.018, 40]} />
            {metal("#2f3238")}
          </mesh>
        ))}
        <mesh position={[0, (CROWN_OFFSET - 0.18 - SKIRT_OFFSET) / 2, 0]}>
          <cylinderGeometry args={[BORE_R - 0.016, BORE_R - 0.02, CROWN_OFFSET - 0.18 + SKIRT_OFFSET, 40, 1, true]} />
          <meshStandardMaterial color="#d7dade" roughness={0.3} metalness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 2 * BORE_R - 0.06, 20]} />
          {metal("#a3a9b2")}
        </mesh>
      </group>
    </group>
  );
}

function Valve({ kind }: { kind: "intake" | "exhaust" }) {
  const ref = useRef<THREE.Group>(null);
  const cam = useRef<THREE.Group>(null);
  const lobe = useMemo(lobeGeometry, []);
  const x = kind === "intake" ? -VX : VX;
  const tint = kind === "intake" ? "#9cc3ff" : "#e3a57e";
  const peak = kind === "intake" ? INTAKE_PEAK : EXHAUST_PEAK;
  const stemTop = CAM_Y - 0.09 - 0.05;
  useFrame(() => {
    const c = cycleClock.angle;
    const l = (kind === "intake" ? intakeLift(c) : exhaustLift(c)) * LIFT;
    if (ref.current) ref.current.position.y = -l;
    if (cam.current) cam.current.rotation.z = Math.PI + (peak / 2) * DEG - (c / 2) * DEG;
  });
  return (
    <group position={[x, 0, 0]}>
      <group ref={ref}>
        <mesh position={[0, DECK_Y + 0.025, 0]}>
          <cylinderGeometry args={[0.04, 0.13, 0.05, 32]} />
          {metal(tint, 0.25)}
        </mesh>
        <mesh position={[0, (DECK_Y + stemTop) / 2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, stemTop - DECK_Y, 10]} />
          {metal(tint, 0.25)}
        </mesh>
        <mesh position={[0, stemTop + 0.025, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.05, 20]} />
          {metal("#c9ced6", 0.2)}
        </mesh>
      </group>
      <group ref={cam} position={[0, CAM_Y, 0]}>
        <mesh geometry={lobe}>{metal("#b3b9c2", 0.18, 0.95)}</mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
          {metal("#8f959e", 0.25)}
        </mesh>
      </group>
    </group>
  );
}

function Housing() {
  const { intake, exhaust } = useCurves();
  const glass = (
    <meshPhysicalMaterial
      color="#9fc7ff"
      transparent
      opacity={0.12}
      roughness={0.05}
      metalness={0}
      depthWrite={false}
      side={THREE.DoubleSide}
    />
  );
  const cylH = DECK_Y - 0.5;
  return (
    <group>
      {/* back half of cylinder wall */}
      <mesh position={[0, 0.5 + cylH / 2, 0]}>
        <cylinderGeometry args={[BORE_R + 0.01, BORE_R + 0.01, cylH, 48, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#5b6470" roughness={0.45} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* block section behind */}
      <mesh position={[0, 0.5 + cylH / 2, -0.52]}>
        <boxGeometry args={[1.3, cylH, 0.2]} />
        <meshStandardMaterial color="#3b424c" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* front glass half */}
      <mesh position={[0, 0.5 + cylH / 2, 0]}>
        <cylinderGeometry args={[BORE_R + 0.01, BORE_R + 0.01, cylH, 48, 1, true, -Math.PI / 2, Math.PI]} />
        {glass}
      </mesh>
      {/* head (back half) */}
      <mesh position={[0, DECK_Y + 0.4, -0.35]}>
        <boxGeometry args={[1.5, 0.8, 0.3]} />
        <meshStandardMaterial color="#6f7782" roughness={0.45} metalness={0.7} />
      </mesh>
      <mesh position={[0, DECK_Y + 0.4, 0.08]}>
        <boxGeometry args={[1.5, 0.8, 0.56]} />
        {glass}
      </mesh>
      {/* ports */}
      <mesh>
        <tubeGeometry args={[intake, 40, 0.13, 20, false]} />
        <meshPhysicalMaterial color="#4da3ff" transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <tubeGeometry args={[exhaust, 40, 0.13, 20, false]} />
        <meshPhysicalMaterial color="#ff9a5c" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* crankcase back plate */}
      <mesh position={[0, -0.1, -0.7]}>
        <boxGeometry args={[1.6, 1.4, 0.05]} />
        <meshStandardMaterial color="#2a3038" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* spark plug */}
      <group position={[0, DECK_Y, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
          {metal("#9ea4ad")}
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 6]} />
          {metal("#b9bec6")}
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.4, 16]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.04, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#1a1b1e" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------------------------------------------------------- */

const N = 220;

function Particles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { intake, exhaust } = useCurves();
  const data = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => ({
        r: Math.sqrt(Math.random()) * (BORE_R - 0.05),
        a: Math.random() * Math.PI * 2,
        v: Math.random(),
        t: (i / N) * 0.78,
        fuel: i % 5 === 0,
        ph: Math.random() * Math.PI * 2,
        f: 3 + Math.random() * 4,
        lane: (Math.random() - 0.5) * 0.14,
        lane2: (Math.random() - 0.5) * 0.14,
      })),
    []
  );
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      p: new THREE.Vector3(),
      q: new THREE.Vector3(),
      c: new THREE.Color(),
      one: new THREE.Quaternion(),
      s: new THREE.Vector3(),
      valveIn: new THREE.Vector3(-VX, DECK_Y - 0.04, 0),
      valveOut: new THREE.Vector3(VX, DECK_Y - 0.04, 0),
    }),
    []
  );

  useFrame(({ clock }) => {
    const inst = ref.current;
    if (!inst) return;
    const c = cycleClock.angle;
    const time = clock.elapsedTime;
    const crown = pinHeight(mod(c, 360)) + CROWN_OFFSET;
    const heat = c >= SPARK_DEG && c < 540 ? 1 - (c - SPARK_DEG) / (540 - SPARK_DEG) : 0;
    const jit = 0.008 + heat * 0.03;
    const [gr, gg, gb] = gasColor(c);
    const fIn = clamp01(c / 195);
    const fOut = clamp01((c - 540) / 170);
    const burnt = c >= SPARK_DEG + 6 || c < 1;

    data.forEach((d, i) => {
      // position inside the cylinder
      const inside = (out: THREE.Vector3) => {
        const h = Math.max(0.02, DECK_Y - crown - 0.07);
        out.set(
          d.r * Math.cos(d.a) + Math.sin(time * d.f + d.ph) * jit,
          crown + 0.035 + d.v * h + Math.cos(time * d.f * 1.3 + d.ph) * jit * 0.5,
          d.r * Math.sin(d.a) + Math.cos(time * d.f + d.ph) * jit
        );
        return out;
      };
      let visible = true;
      let colorMode: "gas" | "fresh" | "exhaust" = "gas";
      const delta = 0.22;
      if (c < 540) {
        if (c < 200 && fIn < d.t) visible = false;
        else if (c < 200 && fIn < d.t + delta) {
          const s = (fIn - d.t) / delta;
          colorMode = "fresh";
          if (s < 0.65) {
            intake.getPointAt(s / 0.65, tmp.p);
            tmp.p.y += d.lane;
            tmp.p.z += d.lane2;
          } else {
            inside(tmp.q);
            tmp.p.copy(tmp.valveIn).lerp(tmp.q, (s - 0.65) / 0.35);
          }
        } else inside(tmp.p);
      } else {
        if (fOut < d.t) inside(tmp.p);
        else if (fOut < d.t + delta) {
          const s = (fOut - d.t) / delta;
          colorMode = "exhaust";
          if (s < 0.35) {
            inside(tmp.q);
            tmp.p.copy(tmp.q).lerp(tmp.valveOut, s / 0.35);
          } else {
            exhaust.getPointAt((s - 0.35) / 0.65, tmp.p);
            tmp.p.y += d.lane;
            tmp.p.z += d.lane2;
          }
        } else visible = false;
      }

      const size = visible ? (colorMode === "gas" && heat > 0 ? 1 + heat * 0.6 : 1) : 0;
      tmp.s.setScalar(size);
      tmp.m.compose(tmp.p, tmp.one, tmp.s);
      inst.setMatrixAt(i, tmp.m);

      if (!burnt && d.fuel) tmp.c.setRGB(1.0, 0.72, 0.15);
      else if (colorMode === "fresh") tmp.c.setRGB(0.3, 0.64, 1.0);
      else if (colorMode === "exhaust") tmp.c.setRGB(0.55, 0.57, 0.6);
      else tmp.c.setRGB(gr, gg, gb);
      inst.setColorAt(i, tmp.c);
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[0.026, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Combustion() {
  const flame = useRef<THREE.Mesh>(null);
  const spark = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const bolt = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const c = cycleClock.angle;
    const crown = pinHeight(mod(c, 360)) + CROWN_OFFSET;
    const on = sparkOn(c);
    if (spark.current) {
      spark.current.visible = on;
      spark.current.scale.setScalar(0.8 + Math.random() * 0.8);
    }
    if (bolt.current) {
      bolt.current.visible = on;
      bolt.current.rotation.y = clock.elapsedTime * 40;
    }
    const g = combustionGlow(c);
    if (light.current) {
      light.current.intensity = g * 10 + (on ? 4 : 0);
      light.current.position.y = (crown + DECK_Y) / 2;
    }
    if (flame.current) {
      const grow = smoothstep(SPARK_DEG, SPARK_DEG + 30, c);
      const fade = 1 - smoothstep(SPARK_DEG + 25, SPARK_DEG + 110, c);
      const visible = c > SPARK_DEG && c < SPARK_DEG + 110;
      flame.current.visible = visible;
      const h = Math.max(0.01, (DECK_Y - crown) / 2);
      flame.current.position.y = DECK_Y - Math.min(h * 2, 0.02 + grow * h * 2) / 2;
      const r = 0.05 + grow * (BORE_R - 0.06);
      flame.current.scale.set(r, Math.min(h, 0.02 + grow * h), r);
      (flame.current.material as THREE.MeshBasicMaterial).opacity = 0.75 * fade;
    }
  });
  return (
    <group>
      <mesh ref={spark} position={[0, DECK_Y - 0.03, 0]} visible={false}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={[8, 8, 14]} toneMapped={false} />
      </mesh>
      <mesh ref={bolt} position={[0, DECK_Y - 0.03, 0]} visible={false}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color={[3, 3, 8]} toneMapped={false} wireframe />
      </mesh>
      <mesh ref={flame} visible={false}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial color={[3.5, 1.6, 0.35]} toneMapped={false} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight ref={light} position={[0, 1.9, 0.4]} color="#ff9a3c" distance={4} decay={2} intensity={0} />
    </group>
  );
}

export function CycleClockDriver() {
  useFrame((_, dt) => {
    const { playing, speed } = useCycle.getState();
    if (playing) cycleClock.angle = mod(cycleClock.angle + Math.min(dt, 0.1) * speed * 360, 720);
  });
  return null;
}

export default function CycleScene() {
  return (
    <group>
      <Housing />
      <Mechanism />
      <Valve kind="intake" />
      <Valve kind="exhaust" />
      <Particles />
      <Combustion />
      <Label position={[-1.55, 2.95, 0]}>Air + fuel in</Label>
      <Label position={[1.55, 2.95, 0]}>Exhaust out</Label>
      <Label position={[-0.75, 3.15, 0]}>Intake cam</Label>
      <Label position={[0.75, 3.15, 0]}>Exhaust cam</Label>
      <Label position={[0, 3.25, 0]}>Spark plug</Label>
      <Label position={[0.85, 1.35, 0]}>Piston</Label>
      <Label position={[0.85, 0.55, 0]}>Connecting rod</Label>
      <Label position={[0.85, -0.45, 0]}>Crankshaft</Label>
    </group>
  );
}
