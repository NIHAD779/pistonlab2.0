// Geometry + kinematics shared by every 3D scene.
// Units are arbitrary "scene units"; angles in degrees unless noted.

export const CRANK_R = 0.35; // crank throw radius (stroke = 2R)
export const ROD_L = 1.2; // connecting rod centre-to-centre length
export const BORE_R = 0.4;
export const DECK_Y = 2.0; // underside of the cylinder head
export const CROWN_OFFSET = 0.33; // piston crown above wrist pin
export const SKIRT_OFFSET = 0.2; // skirt bottom below wrist pin
export const CAM_Y = 2.7;
export const VALVE_MAX_LIFT = 0.06;

export const CYL_X = [-1.5, -0.5, 0.5, 1.5];
// Firing order 1-3-4-2 → offset of each cylinder's 720° cycle vs cylinder 1.
export const FIRING_OFFSET = [0, 540, 180, 360];
export const FIRING_ORDER = [1, 3, 4, 2];

export const DEG = Math.PI / 180;

export const mod = (a: number, n: number) => ((a % n) + n) % n;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Height of the wrist pin above the crank axis for a crank angle (deg, 0 = TDC). */
export function pinHeight(throwDeg: number) {
  const t = throwDeg * DEG;
  const s = CRANK_R * Math.sin(t);
  return CRANK_R * Math.cos(t) + Math.sqrt(ROD_L * ROD_L - s * s);
}

export const crownY = (throwDeg: number) => pinHeight(throwDeg) + CROWN_OFFSET;
export const CROWN_TDC = crownY(0);
export const CROWN_BDC = crownY(180);
export const COMPRESSION_RATIO = (DECK_Y - CROWN_BDC) / (DECK_Y - CROWN_TDC);

/** Local 0–720° cycle angle of a cylinder (0 = TDC at start of intake). */
export const cylinderCycle = (globalDeg: number, cyl: number) =>
  mod(globalDeg - FIRING_OFFSET[cyl], 720);

export type Stroke = "intake" | "compression" | "power" | "exhaust";
export const STROKES: Stroke[] = ["intake", "compression", "power", "exhaust"];

export const strokeOf = (cycleDeg: number): Stroke =>
  STROKES[Math.floor(mod(cycleDeg, 720) / 180)];

export const STROKE_META: Record<
  Stroke,
  { label: string; color: string; short: string; piston: string }
> = {
  intake: {
    label: "Intake",
    short: "Suck",
    color: "#4da3ff",
    piston: "moves down",
  },
  compression: {
    label: "Compression",
    short: "Squeeze",
    color: "#b27cff",
    piston: "moves up",
  },
  power: {
    label: "Power",
    short: "Bang",
    color: "#ff8a1f",
    piston: "is forced down",
  },
  exhaust: {
    label: "Exhaust",
    short: "Blow",
    color: "#9aa3ad",
    piston: "moves up",
  },
};

// Valve timing (in cycle degrees). Opens slightly early / closes late like a real engine.
export const INTAKE_OPEN = -15;
export const INTAKE_DUR = 230;
export const EXHAUST_OPEN = 505;
export const EXHAUST_DUR = 230;
export const SPARK_DEG = 352;

function lift(cycleDeg: number, open: number, dur: number) {
  const d = mod(cycleDeg - open, 720);
  if (d >= dur) return 0;
  return Math.pow(Math.sin((Math.PI * d) / dur), 1.4);
}
export const intakeLift = (c: number) => lift(c, INTAKE_OPEN, INTAKE_DUR);
export const exhaustLift = (c: number) => lift(c, EXHAUST_OPEN, EXHAUST_DUR);
export const INTAKE_PEAK = INTAKE_OPEN + INTAKE_DUR / 2;
export const EXHAUST_PEAK = EXHAUST_OPEN + EXHAUST_DUR / 2;

/** 0..1 brightness of the combustion flash. */
export function combustionGlow(c: number) {
  if (c < SPARK_DEG - 2 || c > 470) return 0;
  if (c < SPARK_DEG + 8) return smoothstep(SPARK_DEG - 2, SPARK_DEG + 8, c);
  return Math.pow(1 - (c - (SPARK_DEG + 8)) / (470 - SPARK_DEG - 8), 2);
}

export const sparkOn = (c: number) => c > SPARK_DEG - 2 && c < SPARK_DEG + 10;

/** Cylinder volume normalised so V(TDC) = 1. */
export const volumeOf = (c: number) =>
  (DECK_Y - crownY(mod(c, 360))) / (DECK_Y - CROWN_TDC);

/** Simplified pressure model (bar) used for the P-V diagram. */
export function pressureOf(c: number) {
  c = mod(c, 720);
  const V = volumeOf(c);
  const Vb = COMPRESSION_RATIO;
  if (c < 180) return 0.9 - 0.08 * Math.sin((c / 180) * Math.PI);
  if (c < 540) {
    const base = 0.9 * Math.pow(Vb / V, 1.35);
    const burn = smoothstep(SPARK_DEG, SPARK_DEG + 26, c);
    return base * (1 + 2.6 * burn);
  }
  const end = 0.9 * 3.6;
  return 1.08 + (end - 1.08) * Math.exp(-(c - 540) / 14);
}

/** Colour of the gas in a cylinder for a cycle angle, as [r,g,b] (may exceed 1 for bloom). */
export function gasColor(c: number): [number, number, number] {
  const lerp = (a: number[], b: number[], t: number) =>
    a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
  const blue = [0.3, 0.64, 1.0];
  const purple = [0.7, 0.48, 1.0];
  const hot = [4.0, 3.2, 1.6];
  const orange = [1.6, 0.6, 0.1];
  const red = [0.7, 0.15, 0.08];
  const gray = [0.55, 0.57, 0.6];
  if (c < 180) return [blue[0], blue[1], blue[2]];
  if (c < SPARK_DEG) return lerp(blue, purple, smoothstep(180, SPARK_DEG, c));
  if (c < 540) {
    if (c < 390) return lerp(purple, hot, smoothstep(SPARK_DEG, 372, c));
    if (c < 460) return lerp(hot, orange, smoothstep(390, 460, c));
    return lerp(orange, red, smoothstep(460, 540, c));
  }
  return lerp(red, gray, smoothstep(540, 580, c));
}

/** Shared, non-reactive animation clock (global crank angle 0–720°). */
export const engineClock = { angle: 0 };
