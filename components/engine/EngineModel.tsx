"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { useFrame, type ThreeElements, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  BORE_R,
  CAM_Y,
  CRANK_R,
  CROWN_OFFSET,
  CYL_X,
  DECK_Y,
  DEG,
  EXHAUST_PEAK,
  FIRING_OFFSET,
  INTAKE_PEAK,
  ROD_L,
  SKIRT_OFFSET,
  VALVE_MAX_LIFT,
  combustionGlow,
  cylinderCycle,
  engineClock,
  exhaustLift,
  gasColor,
  intakeLift,
  mod,
  pinHeight,
  sparkOn,
} from "@/lib/engineMath";
import { HOUSING, type PartId } from "@/lib/parts";
import { useExplorer } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Materials, selection & interaction                                  */
/* ------------------------------------------------------------------ */

const ACCENT = new THREE.Color("#ff7a1a");
const CUT_PLANES = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
const NO_PLANES: THREE.Plane[] = [];

const PartCtx = createContext<{ id: PartId; interactive: boolean }>({
  id: "block",
  interactive: false,
});

function noRaycast() {}
function cutRaycast(this: THREE.Mesh, rc: THREE.Raycaster, out: THREE.Intersection[]) {
  const hits: THREE.Intersection[] = [];
  THREE.Mesh.prototype.raycast.call(this, rc, hits);
  for (const h of hits) if (h.point.z <= 0.001) out.push(h);
}

interface MatProps {
  color: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

function usePartLook(id: PartId) {
  const selected = useExplorer((s) => s.selected);
  const hovered = useExplorer((s) => s.hovered);
  const isolate = useExplorer((s) => s.isolate);
  const viewMode = useExplorer((s) => s.viewMode);
  const housing = HOUSING.includes(id);
  const faded = !!selected && isolate && selected !== id;
  const xray = viewMode === "xray" && housing && selected !== id;
  const cut = viewMode === "cutaway" && housing;
  const opacity = faded ? 0.07 : xray ? 0.14 : 1;
  const highlight = selected === id ? 0.22 : hovered === id ? 0.3 : 0;
  return { opacity, highlight, cut, pickable: !faded && !xray };
}

type PMProps = Omit<ThreeElements["mesh"], "material"> &
  MatProps & { children?: ReactNode };

/** A mesh that belongs to the current <Part>, with selection-aware material. */
function PM({
  color,
  metalness = 0.75,
  roughness = 0.35,
  emissive,
  emissiveIntensity = 1,
  children,
  ...mesh
}: PMProps) {
  const { id, interactive } = useContext(PartCtx);
  const look = usePartLook(id);
  const transparent = look.opacity < 1;
  const raycast = !interactive || !look.pickable ? noRaycast : look.cut ? cutRaycast : undefined;
  return (
    <mesh {...mesh} raycast={raycast as never} castShadow receiveShadow>
      {children}
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        opacity={look.opacity}
        depthWrite={!transparent}
        side={look.cut || transparent ? THREE.DoubleSide : THREE.FrontSide}
        clippingPlanes={look.cut ? CUT_PLANES : NO_PLANES}
        emissive={look.highlight ? ACCENT : emissive ?? "#000000"}
        emissiveIntensity={look.highlight ? look.highlight : emissiveIntensity}
      />
    </mesh>
  );
}

const EXPLODE: Partial<Record<PartId, [number, number, number]>> = {
  head: [0, 0.9, 0],
  intakeValve: [0, 1.35, 0],
  exhaustValve: [0, 1.35, 0],
  camshaft: [0, 1.9, 0],
  valveCover: [0, 2.6, 0],
  sparkPlug: [0, 3.3, 0],
  oilPan: [0, -0.9, 0],
  intakeManifold: [0, 0.9, -0.9],
  fuelInjector: [0, 1.25, -1.3],
  exhaustManifold: [0, 0.9, 0.9],
  timingBelt: [-0.9, 0, 0],
  flywheel: [0.9, 0, 0],
  crankshaft: [0, -0.25, 0],
};

function Part({
  id,
  interactive,
  children,
}: {
  id: PartId;
  interactive: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const hover = useExplorer((s) => s.hover);
  const select = useExplorer((s) => s.select);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const off = EXPLODE[id];
    if (useExplorer.getState().exploded && off) target.set(...off);
    else target.set(0, 0, 0);
    g.position.lerp(target, 1 - Math.exp(-dt * 5));
  });

  const handlers = interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          hover(id);
          document.body.style.cursor = "pointer";
        },
        onPointerOut: () => {
          if (useExplorer.getState().hovered === id) hover(null);
          document.body.style.cursor = "";
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          select(id);
        },
      }
    : {};

  return (
    <PartCtx.Provider value={{ id, interactive }}>
      <group ref={ref} name={`part:${id}`} {...handlers}>
        {children}
      </group>
    </PartCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Geometry builders                                                   */
/* ------------------------------------------------------------------ */

function blockGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-2.05, -0.6);
  s.lineTo(2.05, -0.6);
  s.lineTo(2.05, 0.6);
  s.lineTo(-2.05, 0.6);
  s.closePath();
  for (const x of CYL_X) {
    const h = new THREE.Path();
    h.absarc(x, 0, BORE_R + 0.005, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.45, bevelEnabled: false, curveSegments: 40 });
  g.rotateX(Math.PI / 2);
  g.translate(0, DECK_Y, 0);
  return g;
}

function bulkheadGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.75, -0.65);
  s.lineTo(0.75, -0.65);
  s.lineTo(0.75, 0.55);
  s.lineTo(-0.75, 0.55);
  s.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, 0.14, 0, Math.PI * 2, true);
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -0.04);
  g.rotateY(-Math.PI / 2);
  return g;
}

function webGeometry() {
  const s = new THREE.Shape();
  const pr = 0.15;
  const cw = 0.47;
  s.moveTo(-pr, CRANK_R);
  s.absarc(0, CRANK_R, pr, Math.PI, 0, true);
  s.lineTo(pr, 0);
  s.lineTo(cw * Math.cos(-25 * DEG), cw * Math.sin(-25 * DEG));
  s.absarc(0, 0, cw, -25 * DEG, -155 * DEG, true);
  s.lineTo(-pr, 0);
  s.closePath();
  const d = 0.09;
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 24,
  });
  g.translate(0, 0, -d / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

function lobeGeometry() {
  const pts: THREE.Vector2[] = [];
  const n = 64;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 0.07 + 0.062 * Math.pow(Math.max(0, Math.cos(a - Math.PI / 2)), 3);
    pts.push(new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)));
  }
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.09, bevelEnabled: false });
  g.translate(0, 0, -0.045);
  g.rotateY(Math.PI / 2);
  return g;
}

function helixGeometry(radius: number, height: number, turns: number, wire: number) {
  class Helix extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super();
    }
    getPoint(t: number, target = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2;
      return target.set(Math.cos(a) * radius, t * height, Math.sin(a) * radius);
    }
  }
  return new THREE.TubeGeometry(new Helix(), turns * 16, wire, 5, false);
}

function convexHull(points: THREE.Vector2[]) {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: THREE.Vector2[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: THREE.Vector2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/* ------------------------------------------------------------------ */
/* Static housing                                                      */
/* ------------------------------------------------------------------ */

const BLOCK_COLOR = "#8d949e";

function Block({ interactive }: { interactive: boolean }) {
  const block = useMemo(blockGeometry, []);
  const bulk = useMemo(bulkheadGeometry, []);
  return (
    <Part id="block" interactive={interactive}>
      <PM geometry={block} color={BLOCK_COLOR} metalness={0.6} roughness={0.5} />
      {/* crankcase side walls */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <PM position={[0, -0.05, s * 0.72]} color={BLOCK_COLOR} metalness={0.6} roughness={0.5}>
            <boxGeometry args={[4.1, 1.2, 0.06]} />
          </PM>
          <PM position={[0, 0.55, s * 0.66]} color={BLOCK_COLOR} metalness={0.6} roughness={0.5}>
            <boxGeometry args={[4.1, 0.06, 0.18]} />
          </PM>
        </group>
      ))}
      {[-2.05, -1, 0, 1, 2.05].map((x) => (
        <PM key={x} geometry={bulk} position={[x, 0, 0]} color={BLOCK_COLOR} metalness={0.6} roughness={0.5} />
      ))}
    </Part>
  );
}

function Head({ interactive }: { interactive: boolean }) {
  return (
    <Part id="head" interactive={interactive}>
      <PM position={[0, 2.25, 0]} color="#b3b8bf" metalness={0.65} roughness={0.4}>
        <boxGeometry args={[4.1, 0.5, 1.2]} />
      </PM>
      {/* head gasket */}
      <PM position={[0, DECK_Y + 0.004, 0]} color="#3d3f44" metalness={0.9} roughness={0.3}>
        <boxGeometry args={[4.12, 0.01, 1.22]} />
      </PM>
    </Part>
  );
}

function ValveCover({ interactive }: { interactive: boolean }) {
  const geo = useMemo(() => new RoundedBoxGeometry(4.0, 0.44, 1.12, 3, 0.1), []);
  return (
    <Part id="valveCover" interactive={interactive}>
      <PM geometry={geo} position={[0, 2.72, 0]} color="#c3262e" metalness={0.35} roughness={0.35} />
      {/* ribs */}
      {[-1, 0, 1].map((x) => (
        <PM key={x} position={[x, 2.95, 0.35]} color="#9a1d24" metalness={0.4} roughness={0.4}>
          <boxGeometry args={[0.6, 0.03, 0.08]} />
        </PM>
      ))}
      {/* oil filler cap */}
      <PM position={[1.5, 2.96, -0.35]} rotation={[0, 0, 0]} color="#1b1c1f" metalness={0.2} roughness={0.6}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 24]} />
      </PM>
    </Part>
  );
}

function OilPan({ interactive }: { interactive: boolean }) {
  return (
    <Part id="oilPan" interactive={interactive}>
      <PM position={[0, -0.92, 0]} color="#41464e" metalness={0.7} roughness={0.45}>
        <boxGeometry args={[3.9, 0.55, 1.35]} />
      </PM>
      <PM position={[0, -0.66, 0]} color="#41464e" metalness={0.7} roughness={0.45}>
        <boxGeometry args={[4.1, 0.04, 1.5]} />
      </PM>
      {/* the oil itself */}
      <PM position={[0, -1.05, -0.1]} color="#6b4410" metalness={0.2} roughness={0.15}>
        <boxGeometry args={[3.8, 0.22, 1.1]} />
      </PM>
    </Part>
  );
}

/* ------------------------------------------------------------------ */
/* Moving internals                                                    */
/* ------------------------------------------------------------------ */

const throwAngle = (cyl: number) => (cyl === 1 || cyl === 2 ? Math.PI : 0);

function Crankshaft({ interactive }: { interactive: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const web = useMemo(webGeometry, []);
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = engineClock.angle * DEG;
  });
  const journals: [number, number][] = [
    [-2.4, CYL_X[0] - 0.2],
    ...CYL_X.slice(0, 3).map((x, i) => [x + 0.2, CYL_X[i + 1] - 0.2] as [number, number]),
    [CYL_X[3] + 0.2, 2.25],
  ];
  const steel = { color: "#767d87", metalness: 0.9, roughness: 0.25 };
  return (
    <Part id="crankshaft" interactive={interactive}>
      <group ref={ref}>
        {journals.map(([a, b], i) => (
          <PM key={i} position={[(a + b) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} {...steel}>
            <cylinderGeometry args={[0.11, 0.11, b - a, 28]} />
          </PM>
        ))}
        {CYL_X.map((x, i) => (
          <group key={x} position={[x, 0, 0]} rotation={[throwAngle(i), 0, 0]}>
            <PM geometry={web} position={[-0.2, 0, 0]} {...steel} />
            <PM geometry={web} position={[0.2, 0, 0]} {...steel} />
            <PM position={[0, CRANK_R, 0]} rotation={[0, 0, Math.PI / 2]} color="#aab1bb" metalness={0.95} roughness={0.15}>
              <cylinderGeometry args={[0.1, 0.1, 0.34, 28]} />
            </PM>
          </group>
        ))}
        {/* rear flange */}
        <PM position={[2.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} {...steel}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 32]} />
        </PM>
      </group>
    </Part>
  );
}

function Pistons({ interactive }: { interactive: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    CYL_X.forEach((_, i) => {
      const g = refs.current[i];
      if (g) g.position.y = pinHeight(mod(engineClock.angle - FIRING_OFFSET[i], 360));
    });
  });
  const alu = { color: "#d7dade", metalness: 0.7, roughness: 0.3 };
  const top = CROWN_OFFSET;
  const bot = -SKIRT_OFFSET;
  return (
    <Part id="piston" interactive={interactive}>
      {CYL_X.map((x, i) => (
        <group key={x} ref={(g) => { refs.current[i] = g; }} position={[x, 1.2, 0]}>
          {/* crown */}
          <PM position={[0, top - 0.09, 0]} {...alu}>
            <cylinderGeometry args={[BORE_R - 0.012, BORE_R - 0.012, 0.18, 40]} />
          </PM>
          {/* rings */}
          {[0.035, 0.085, 0.14].map((d, k) => (
            <PM key={k} position={[0, top - d, 0]} color={k === 2 ? "#5b6068" : "#2f3238"} metalness={0.9} roughness={0.3}>
              <cylinderGeometry args={[BORE_R - 0.004, BORE_R - 0.004, 0.018, 40]} />
            </PM>
          ))}
          {/* skirt */}
          <PM position={[0, (top - 0.18 + bot) / 2, 0]} {...alu}>
            <cylinderGeometry args={[BORE_R - 0.016, BORE_R - 0.02, top - 0.18 - bot, 40, 1, true]} />
          </PM>
          {/* wrist pin */}
          <PM rotation={[0, 0, Math.PI / 2]} color="#a3a9b2" metalness={0.95} roughness={0.2}>
            <cylinderGeometry args={[0.055, 0.055, 2 * BORE_R - 0.06, 20]} />
          </PM>
        </group>
      ))}
    </Part>
  );
}

function Conrods({ interactive }: { interactive: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    CYL_X.forEach((_, i) => {
      const g = refs.current[i];
      if (!g) return;
      const t = mod(engineClock.angle - FIRING_OFFSET[i], 360);
      const py = CRANK_R * Math.cos(t * DEG);
      const pz = CRANK_R * Math.sin(t * DEG);
      g.position.y = py;
      g.position.z = pz;
      g.rotation.x = Math.atan2(-pz, pinHeight(t) - py);
    });
  });
  const beamShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.075, 0.1);
    s.lineTo(0.075, 0.1);
    s.lineTo(0.045, ROD_L - 0.06);
    s.lineTo(-0.045, ROD_L - 0.06);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 });
    g.translate(0, 0, -0.035);
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  const steel = { color: "#8c939d", metalness: 0.85, roughness: 0.3 };
  return (
    <Part id="conrod" interactive={interactive}>
      {CYL_X.map((x, i) => (
        <group key={x} ref={(g) => { refs.current[i] = g; }} position={[x, 0, 0]}>
          <PM geometry={beamShape} {...steel} />
          <PM rotation={[0, 0, Math.PI / 2]} {...steel}>
            <cylinderGeometry args={[0.16, 0.16, 0.12, 28]} />
          </PM>
          <PM position={[0, ROD_L, 0]} rotation={[0, 0, Math.PI / 2]} {...steel}>
            <cylinderGeometry args={[0.085, 0.085, 0.1, 24]} />
          </PM>
          {/* cap bolts */}
          {[-1, 1].map((s) => (
            <PM key={s} position={[0, -0.02, s * 0.13]} color="#3a3d42" metalness={0.9} roughness={0.3}>
              <cylinderGeometry args={[0.025, 0.025, 0.28, 10]} />
            </PM>
          ))}
        </group>
      ))}
    </Part>
  );
}

const VALVE_DX = 0.17;
const VALVE_Z = 0.2;

function Camshafts({ interactive }: { interactive: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const lobe = useMemo(lobeGeometry, []);
  useFrame(() => {
    for (const g of refs.current) if (g) g.rotation.x = (engineClock.angle / 2) * DEG;
  });
  return (
    <Part id="camshaft" interactive={interactive}>
      {[
        { z: -VALVE_Z, peak: INTAKE_PEAK },
        { z: VALVE_Z, peak: EXHAUST_PEAK },
      ].map(({ z, peak }, k) => (
        <group key={k} position={[0, CAM_Y, z]} ref={(g) => { refs.current[k] = g; }}>
          <PM rotation={[0, 0, Math.PI / 2]} color="#8f959e" metalness={0.9} roughness={0.25}>
            <cylinderGeometry args={[0.045, 0.045, 4.8, 16]} />
          </PM>
          {CYL_X.map((x, i) => {
            const beta = Math.PI - ((FIRING_OFFSET[i] + peak) / 2) * DEG;
            return [-VALVE_DX, VALVE_DX].map((dx) => (
              <PM key={`${i}${dx}`} geometry={lobe} position={[x + dx, 0, 0]} rotation={[beta, 0, 0]} color="#b3b9c2" metalness={0.95} roughness={0.18} />
            ));
          })}
          {/* bearing journals */}
          {[-2, -1, 0, 1, 2].map((x) => (
            <PM key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#8f959e" metalness={0.9} roughness={0.25}>
              <cylinderGeometry args={[0.07, 0.07, 0.1, 20]} />
            </PM>
          ))}
        </group>
      ))}
    </Part>
  );
}

function Valves({ kind, interactive }: { kind: "intake" | "exhaust"; interactive: boolean }) {
  const z = kind === "intake" ? -VALVE_Z : VALVE_Z;
  const tint = kind === "intake" ? "#9cc3ff" : "#e3a57e";
  const refs = useRef<(THREE.Group | null)[]>([]);
  const springRefs = useRef<(THREE.Mesh | null)[]>([]);
  const spring = useMemo(() => helixGeometry(0.05, 0.2, 6, 0.008), []);
  const liftFn = kind === "intake" ? intakeLift : exhaustLift;
  useFrame(() => {
    CYL_X.forEach((_, i) => {
      const l = liftFn(cylinderCycle(engineClock.angle, i)) * VALVE_MAX_LIFT;
      for (let k = 0; k < 2; k++) {
        const g = refs.current[i * 2 + k];
        if (g) g.position.y = -l;
        const s = springRefs.current[i * 2 + k];
        if (s) s.scale.y = (0.2 - l) / 0.2;
      }
    });
  });
  const stemTop = CAM_Y - 0.07 - 0.05;
  return (
    <Part id={kind === "intake" ? "intakeValve" : "exhaustValve"} interactive={interactive}>
      {CYL_X.flatMap((x, i) =>
        [-VALVE_DX, VALVE_DX].map((dx, k) => (
          <group key={`${i}${k}`} position={[x + dx, 0, z]}>
            <group ref={(g) => { refs.current[i * 2 + k] = g; }}>
              <PM position={[0, DECK_Y + 0.025, 0]} color={tint} metalness={0.85} roughness={0.25}>
                <cylinderGeometry args={[0.035, 0.115, 0.05, 32]} />
              </PM>
              <PM position={[0, (DECK_Y + stemTop) / 2, 0]} color={tint} metalness={0.85} roughness={0.25}>
                <cylinderGeometry args={[0.018, 0.018, stemTop - DECK_Y, 10]} />
              </PM>
              {/* bucket tappet */}
              <PM position={[0, stemTop + 0.025, 0]} color="#c9ced6" metalness={0.9} roughness={0.2}>
                <cylinderGeometry args={[0.065, 0.065, 0.05, 20]} />
              </PM>
            </group>
            {/* spring sits on the head; top follows the retainer */}
            <PM
              ref={(m: THREE.Mesh | null) => { springRefs.current[i * 2 + k] = m; }}
              geometry={spring}
              position={[0, stemTop - 0.2 - 0.005, 0]}
              color="#6b7079"
              metalness={0.8}
              roughness={0.35}
            />
          </group>
        ))
      )}
    </Part>
  );
}

function SparkPlugs({ interactive }: { interactive: boolean }) {
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    CYL_X.forEach((_, i) => {
      const m = sparkRefs.current[i];
      if (m) m.visible = sparkOn(cylinderCycle(engineClock.angle, i));
    });
  });
  return (
    <Part id="sparkPlug" interactive={interactive}>
      {CYL_X.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <PM position={[0, DECK_Y + 0.22, 0]} color="#9ea4ad" metalness={0.9} roughness={0.3}>
            <cylinderGeometry args={[0.035, 0.035, 0.44, 12]} />
          </PM>
          <PM position={[0, DECK_Y + 0.49, 0]} color="#b9bec6" metalness={0.9} roughness={0.25}>
            <cylinderGeometry args={[0.06, 0.06, 0.1, 6]} />
          </PM>
          <PM position={[0, DECK_Y + 0.74, 0]} color="#f2f0ea" metalness={0.05} roughness={0.35}>
            <cylinderGeometry args={[0.03, 0.045, 0.4, 16]} />
          </PM>
          <PM position={[0, DECK_Y + 0.99, 0]} color="#1a1b1e" metalness={0.2} roughness={0.6}>
            <cylinderGeometry args={[0.055, 0.055, 0.12, 16]} />
          </PM>
          <PM position={[0, DECK_Y - 0.012, 0]} color="#d0d4da" metalness={0.9} roughness={0.2}>
            <boxGeometry args={[0.012, 0.024, 0.012]} />
          </PM>
          <mesh ref={(m) => { sparkRefs.current[i] = m; }} position={[0, DECK_Y - 0.03, 0]} visible={false} raycast={noRaycast}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color={[6, 6, 12]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </Part>
  );
}

function FuelInjectors({ interactive }: { interactive: boolean }) {
  return (
    <Part id="fuelInjector" interactive={interactive}>
      {CYL_X.map((x) => (
        <group key={x} position={[x, 2.5, -0.9]} rotation={[-0.69, 0, 0]}>
          <PM color="#26282c" metalness={0.4} roughness={0.5}>
            <cylinderGeometry args={[0.04, 0.03, 0.32, 16]} />
          </PM>
          <PM position={[0, 0.2, 0]} color="#2f7d4f" metalness={0.2} roughness={0.5}>
            <boxGeometry args={[0.1, 0.09, 0.08]} />
          </PM>
          <PM position={[0, -0.18, 0]} color="#c9ced6" metalness={0.9} roughness={0.2}>
            <cylinderGeometry args={[0.012, 0.022, 0.06, 10]} />
          </PM>
        </group>
      ))}
      {/* fuel rail */}
      <PM position={[0, 2.7, -1.03]} rotation={[0, 0, Math.PI / 2]} color="#9aa0a8" metalness={0.9} roughness={0.25}>
        <cylinderGeometry args={[0.05, 0.05, 3.6, 16]} />
      </PM>
    </Part>
  );
}

/* ------------------------------------------------------------------ */
/* Manifolds, belt, flywheel                                           */
/* ------------------------------------------------------------------ */

function IntakeManifold({ interactive }: { interactive: boolean }) {
  const runners = useMemo(
    () =>
      CYL_X.map(
        (x) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(x, 2.25, -0.58),
              new THREE.Vector3(x, 2.3, -0.95),
              new THREE.Vector3(x, 2.0, -1.4),
              new THREE.Vector3(x, 1.45, -1.5),
            ]),
            40,
            0.12,
            18,
            false
          )
      ),
    []
  );
  const color = "#5d6570";
  return (
    <Part id="intakeManifold" interactive={interactive}>
      {runners.map((g, i) => (
        <PM key={i} geometry={g} color={color} metalness={0.55} roughness={0.45} />
      ))}
      <PM position={[0, 1.38, -1.55]} rotation={[0, 0, Math.PI / 2]} color={color} metalness={0.55} roughness={0.45}>
        <capsuleGeometry args={[0.3, 3.5, 8, 24]} />
      </PM>
      {/* throttle body */}
      <PM position={[-2.3, 1.38, -1.55]} rotation={[0, 0, Math.PI / 2]} color="#aab0b8" metalness={0.85} roughness={0.25}>
        <cylinderGeometry args={[0.22, 0.22, 0.35, 32, 1, true]} />
      </PM>
      <PM position={[-2.3, 1.38, -1.55]} rotation={[0.6, 0, Math.PI / 2]} color="#c9ced6" metalness={0.9} roughness={0.2}>
        <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
      </PM>
      {/* flange on head */}
      <PM position={[0, 2.25, -0.62]} color={color} metalness={0.55} roughness={0.45}>
        <boxGeometry args={[4.0, 0.36, 0.05]} />
      </PM>
    </Part>
  );
}

function ExhaustManifold({ interactive }: { interactive: boolean }) {
  const pipes = useMemo(() => {
    const c = new THREE.Vector3(0.3, 0.45, 1.15);
    const headers = CYL_X.map(
      (x) =>
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(x, 2.25, 0.58),
            new THREE.Vector3(x, 2.22, 0.95),
            new THREE.Vector3(x * 0.75 + 0.05, 1.6, 1.18),
            new THREE.Vector3(x * 0.3 + 0.2, 0.95, 1.2),
            c,
          ]),
          48,
          0.1,
          16,
          false
        )
    );
    const down = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        c,
        new THREE.Vector3(0.4, -0.1, 1.15),
        new THREE.Vector3(1.2, -0.8, 1.2),
        new THREE.Vector3(2.9, -1.0, 1.2),
      ]),
      40,
      0.15,
      18,
      false
    );
    return [...headers, down];
  }, []);
  return (
    <Part id="exhaustManifold" interactive={interactive}>
      {pipes.map((g, i) => (
        <PM key={i} geometry={g} color="#7b5a46" metalness={0.8} roughness={0.4} emissive="#3a1204" emissiveIntensity={0.6} />
      ))}
      <PM position={[0.3, 0.45, 1.15]} color="#7b5a46" metalness={0.8} roughness={0.4}>
        <sphereGeometry args={[0.2, 24, 16]} />
      </PM>
      <PM position={[0, 2.25, 0.62]} color="#6b4e3d" metalness={0.8} roughness={0.4}>
        <boxGeometry args={[4.0, 0.34, 0.05]} />
      </PM>
    </Part>
  );
}

const BELT_X = -2.35;
const CRANK_SPROCKET_R = 0.095;
const CAM_SPROCKET_R = 0.19;

function TimingBelt({ interactive }: { interactive: boolean }) {
  const { tube, curve, length } = useMemo(() => {
    const circles: [number, number, number][] = [
      [0, 0, CRANK_SPROCKET_R + 0.02],
      [-VALVE_Z, CAM_Y, CAM_SPROCKET_R + 0.02],
      [VALVE_Z, CAM_Y, CAM_SPROCKET_R + 0.02],
    ];
    const pts: THREE.Vector2[] = [];
    for (const [z, y, r] of circles)
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        pts.push(new THREE.Vector2(z + r * Math.cos(a), y + r * Math.sin(a)));
      }
    const hull = convexHull(pts);
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i];
      const b = hull[(i + 1) % hull.length];
      path.add(new THREE.LineCurve3(new THREE.Vector3(BELT_X, a.y, a.x), new THREE.Vector3(BELT_X, b.y, b.x)));
    }
    return { tube: new THREE.TubeGeometry(path, 400, 0.02, 6, true), curve: path, length: path.getLength() };
  }, []);

  const teeth = useRef<THREE.InstancedMesh>(null);
  const crankRef = useRef<THREE.Group>(null);
  const camRefs = useRef<(THREE.Group | null)[]>([]);
  const N = 90;
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), z: new THREE.Vector3(0, 0, 1) }),
    []
  );
  useFrame(() => {
    const a = engineClock.angle * DEG;
    if (crankRef.current) crankRef.current.rotation.x = a;
    for (const g of camRefs.current) if (g) g.rotation.x = a / 2;
    const inst = teeth.current;
    if (!inst) return;
    const shift = mod((-a * (CRANK_SPROCKET_R + 0.02)) / length, 1);
    for (let i = 0; i < N; i++) {
      const u = mod(i / N + shift, 1);
      curve.getPointAt(u, tmp.p);
      curve.getTangentAt(u, tmp.t);
      tmp.q.setFromUnitVectors(tmp.z, tmp.t);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      inst.setMatrixAt(i, tmp.m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  const sprocket = (r: number) => (
    <>
      <PM rotation={[0, 0, Math.PI / 2]} color="#a9afb8" metalness={0.9} roughness={0.25}>
        <cylinderGeometry args={[r, r, 0.07, 36]} />
      </PM>
      <PM position={[0, r * 0.55, 0]} color="#ff7a1a" metalness={0.3} roughness={0.4}>
        <boxGeometry args={[0.075, r * 0.3, 0.04]} />
      </PM>
    </>
  );
  return (
    <Part id="timingBelt" interactive={interactive}>
      <PM geometry={tube} color="#222428" metalness={0.1} roughness={0.8} />
      <instancedMesh ref={teeth} args={[undefined, undefined, N]} raycast={noRaycast}>
        <boxGeometry args={[0.06, 0.02, 0.018]} />
        <meshStandardMaterial color="#3a3d44" roughness={0.8} />
      </instancedMesh>
      <group ref={crankRef} position={[BELT_X, 0, 0]}>
        {sprocket(CRANK_SPROCKET_R)}
      </group>
      {[-VALVE_Z, VALVE_Z].map((z, k) => (
        <group key={z} position={[BELT_X, CAM_Y, z]} ref={(g) => { camRefs.current[k] = g; }}>
          {sprocket(CAM_SPROCKET_R)}
        </group>
      ))}
    </Part>
  );
}

function Flywheel({ interactive }: { interactive: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const teeth = useMemo(() => {
    const n = 96;
    return Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2);
  }, []);
  useFrame(() => {
    if (ref.current) ref.current.rotation.x = engineClock.angle * DEG;
  });
  return (
    <Part id="flywheel" interactive={interactive}>
      <group ref={ref} position={[2.36, 0, 0]}>
        <PM rotation={[0, 0, Math.PI / 2]} color="#5a6069" metalness={0.85} roughness={0.35}>
          <cylinderGeometry args={[0.62, 0.62, 0.11, 64]} />
        </PM>
        <PM position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#9ca3ad" metalness={0.95} roughness={0.15}>
          <cylinderGeometry args={[0.45, 0.45, 0.02, 64]} />
        </PM>
        {teeth.map((a, i) => (
          <PM key={i} position={[0, Math.cos(a) * 0.64, Math.sin(a) * 0.64]} rotation={[a, 0, 0]} color="#474c54" metalness={0.9} roughness={0.3}>
            <boxGeometry args={[0.1, 0.04, 0.022]} />
          </PM>
        ))}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k / 6) * Math.PI * 2;
          return (
            <PM key={k} position={[0.07, Math.cos(a) * 0.3, Math.sin(a) * 0.3]} rotation={[0, 0, Math.PI / 2]} color="#2c2f34" metalness={0.8} roughness={0.4}>
              <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
            </PM>
          );
        })}
      </group>
    </Part>
  );
}

/* ------------------------------------------------------------------ */
/* Combustion visuals                                                  */
/* ------------------------------------------------------------------ */

function Gases() {
  const showGas = useExplorer((s) => s.showGas);
  const viewMode = useExplorer((s) => s.viewMode);
  const selected = useExplorer((s) => s.selected);
  const isolate = useExplorer((s) => s.isolate);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(BORE_R - 0.008, BORE_R - 0.008, 1, 32);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  useFrame(() => {
    CYL_X.forEach((_, i) => {
      const c = cylinderCycle(engineClock.angle, i);
      const m = meshRefs.current[i];
      const crown = pinHeight(mod(c, 360)) + CROWN_OFFSET;
      if (m) {
        m.position.y = crown;
        m.scale.y = Math.max(0.001, DECK_Y - crown);
        const [r, g, b] = gasColor(c);
        (m.material as THREE.MeshBasicMaterial).color.setRGB(r, g, b);
      }
      const l = lightRefs.current[i];
      if (l) l.intensity = combustionGlow(c) * 5;
    });
  });
  const visible = showGas && viewMode !== "solid" && !(selected && isolate);
  return (
    <group>
      {CYL_X.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh ref={(m) => { meshRefs.current[i] = m; }} geometry={geo} visible={visible} raycast={noRaycast}>
            <meshBasicMaterial transparent opacity={0.38} depthWrite={false} toneMapped={false} />
          </mesh>
          <pointLight ref={(l) => { lightRefs.current[i] = l; }} position={[0, 1.8, 0.1]} color="#ff9a3c" distance={3} decay={2} intensity={0} />
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function EngineClockDriver() {
  useFrame((_, dt) => {
    const { playing, speed } = useExplorer.getState();
    if (playing) engineClock.angle = mod(engineClock.angle + Math.min(dt, 0.1) * speed * 360, 720);
  });
  return null;
}

export default function EngineModel({ interactive = true }: { interactive?: boolean }) {
  const p = { interactive };
  return (
    <group>
      <Block {...p} />
      <Head {...p} />
      <ValveCover {...p} />
      <OilPan {...p} />
      <Crankshaft {...p} />
      <Pistons {...p} />
      <Conrods {...p} />
      <Camshafts {...p} />
      <Valves kind="intake" {...p} />
      <Valves kind="exhaust" {...p} />
      <SparkPlugs {...p} />
      <FuelInjectors {...p} />
      <IntakeManifold {...p} />
      <ExhaustManifold {...p} />
      <TimingBelt {...p} />
      <Flywheel {...p} />
      <Gases />
    </group>
  );
}
