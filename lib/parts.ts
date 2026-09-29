export type PartId =
  | "block"
  | "head"
  | "valveCover"
  | "oilPan"
  | "piston"
  | "conrod"
  | "crankshaft"
  | "camshaft"
  | "intakeValve"
  | "exhaustValve"
  | "sparkPlug"
  | "timingBelt"
  | "flywheel"
  | "intakeManifold"
  | "exhaustManifold"
  | "fuelInjector";

export type Category =
  | "Structure"
  | "Rotating & reciprocating"
  | "Valvetrain"
  | "Fuel & ignition"
  | "Breathing";

export interface PartInfo {
  id: PartId;
  name: string;
  category: Category;
  tagline: string;
  description: string;
  howItWorks: string[];
  facts: { label: string; value: string }[];
  didYouKnow: string;
}

export const CATEGORIES: Category[] = [
  "Structure",
  "Rotating & reciprocating",
  "Valvetrain",
  "Fuel & ignition",
  "Breathing",
];

export const PARTS: PartInfo[] = [
  {
    id: "block",
    name: "Engine Block",
    category: "Structure",
    tagline: "The backbone that holds everything together",
    description:
      "The engine block is the large cast-metal body of the engine. It contains the cylinder bores the pistons slide in, the passages for coolant and oil, and the lower half (crankcase) that supports the crankshaft.",
    howItWorks: [
      "Cylinder bores guide the pistons in a perfectly straight line.",
      "Water jackets around the bores carry coolant to remove combustion heat.",
      "Main bearing webs in the crankcase hold the crankshaft in place while it spins.",
    ],
    facts: [
      { label: "Material", value: "Cast iron or aluminium alloy" },
      { label: "Layout shown", value: "Inline-4 (4 cylinders in a row)" },
      { label: "Typical weight", value: "30–90 kg" },
    ],
    didYouKnow:
      "Many aluminium blocks use thin iron sleeves (liners) inside the bores because aluminium alone wears too quickly against piston rings.",
  },
  {
    id: "head",
    name: "Cylinder Head",
    category: "Structure",
    tagline: "The lid on top of the cylinders",
    description:
      "The cylinder head bolts to the top of the block and seals the cylinders. It forms the roof of each combustion chamber and houses the valves, ports, spark plugs and usually the camshafts.",
    howItWorks: [
      "Intake ports channel the air-fuel mixture toward the intake valves.",
      "Exhaust ports lead burnt gas away from the exhaust valves.",
      "A head gasket between head and block seals in pressures above 60 bar.",
    ],
    facts: [
      { label: "Material", value: "Usually aluminium" },
      { label: "Design shown", value: "DOHC, 4 valves per cylinder" },
      { label: "Seal", value: "Multi-layer steel head gasket" },
    ],
    didYouKnow:
      "A \"blown head gasket\" lets coolant into the cylinders — which is why a damaged engine can puff out white, sweet-smelling smoke.",
  },
  {
    id: "valveCover",
    name: "Valve Cover",
    category: "Structure",
    tagline: "Keeps oil in and dirt out",
    description:
      "The valve (or cam) cover sits on top of the cylinder head, enclosing the camshafts and valvetrain. It keeps the oil that lubricates the cams from spraying out.",
    howItWorks: [
      "Sealed with a rubber gasket to the head.",
      "Often includes the oil filler cap and crankcase ventilation (PCV) outlet.",
      "Spark-plug tubes pass straight through it on many engines.",
    ],
    facts: [
      { label: "Material", value: "Aluminium, magnesium or plastic" },
      { label: "Also called", value: "Rocker cover / cam cover" },
    ],
    didYouKnow:
      "Ferrari's red-painted valve covers gave rise to the name \"Testarossa\" — Italian for \"red head\".",
  },
  {
    id: "oilPan",
    name: "Oil Pan (Sump)",
    category: "Structure",
    tagline: "The engine's oil reservoir",
    description:
      "The oil pan bolts to the bottom of the block. It stores the engine oil, which the oil pump draws up and pushes through the engine to lubricate and cool the moving parts.",
    howItWorks: [
      "Oil drains back into the pan by gravity after lubricating the engine.",
      "The oil pump's pickup tube sits near the bottom of the pan.",
      "Baffles stop oil sloshing away from the pickup during hard cornering.",
    ],
    facts: [
      { label: "Typical capacity", value: "4–6 litres" },
      { label: "Material", value: "Pressed steel or cast aluminium" },
    ],
    didYouKnow:
      "Race cars often use a \"dry sump\" — a separate oil tank — so the engine can sit lower and never starves of oil in corners.",
  },
  {
    id: "piston",
    name: "Pistons",
    category: "Rotating & reciprocating",
    tagline: "Turns gas pressure into force",
    description:
      "A piston is a metal plug that slides up and down inside the cylinder. When the fuel burns, the hot expanding gas pushes the piston down with tons of force — this is where the engine's power originates.",
    howItWorks: [
      "Piston rings seal the gap to the cylinder wall so gas can't escape.",
      "The oil control ring scrapes excess oil off the wall on the way down.",
      "A hardened wrist (gudgeon) pin connects the piston to the connecting rod.",
    ],
    facts: [
      { label: "Material", value: "Forged or cast aluminium alloy" },
      { label: "Top speed at redline", value: "Over 20 m/s average" },
      { label: "Peak force", value: "Several tonnes per piston" },
    ],
    didYouKnow:
      "At 6,000 RPM a piston stops and reverses direction 200 times every second.",
  },
  {
    id: "conrod",
    name: "Connecting Rods",
    category: "Rotating & reciprocating",
    tagline: "Link between straight-line and rotation",
    description:
      "The connecting rod links each piston to the crankshaft. Its small end pivots on the wrist pin while its big end wraps around a crank pin, converting the piston's up-and-down motion into rotation.",
    howItWorks: [
      "The small end rocks back and forth on the wrist pin.",
      "The big end is split with a bolted-on cap so it can clamp around the crank pin.",
      "Thin bearing shells float on a film of pressurised oil.",
    ],
    facts: [
      { label: "Material", value: "Forged steel, powdered metal or titanium" },
      { label: "Cross-section", value: "I-beam or H-beam" },
    ],
    didYouKnow:
      "When a rod breaks and punches through the block, mechanics call it \"throwing a rod\" — sometimes the hole is called a \"window\".",
  },
  {
    id: "crankshaft",
    name: "Crankshaft",
    category: "Rotating & reciprocating",
    tagline: "Where the power becomes rotation",
    description:
      "The crankshaft is a shaft with offset \"throws\" (crank pins). As the connecting rods push on these offset pins it spins — just like your legs pushing bicycle pedals. This rotation eventually turns the wheels.",
    howItWorks: [
      "Each crank pin is offset from the centre by half the piston stroke.",
      "Counterweights opposite the pins balance the spinning mass.",
      "On an inline-4, pistons 1 & 4 move together, as do 2 & 3 (180° apart).",
    ],
    facts: [
      { label: "Material", value: "Forged steel or nodular iron" },
      { label: "Throws (inline-4)", value: "4, arranged flat at 180°" },
      { label: "Firing order shown", value: "1 – 3 – 4 – 2" },
    ],
    didYouKnow:
      "The crankshaft turns twice for every single power stroke of a given cylinder in a four-stroke engine.",
  },
  {
    id: "camshaft",
    name: "Camshafts",
    category: "Valvetrain",
    tagline: "The engine's conductor",
    description:
      "Camshafts carry egg-shaped lobes that push the valves open at exactly the right moment. This engine has two (DOHC): one for the intake valves and one for the exhaust valves.",
    howItWorks: [
      "Each lobe presses down on a bucket tappet sitting on top of a valve.",
      "The camshaft turns at half crankshaft speed — once per 4-stroke cycle.",
      "Lobe shape controls how far, how fast and how long each valve opens.",
    ],
    facts: [
      { label: "Speed ratio", value: "1 : 2 with the crankshaft" },
      { label: "Driven by", value: "Timing belt or chain" },
      { label: "Lobes shown", value: "16 (4 per cylinder)" },
    ],
    didYouKnow:
      "Variable valve timing (e.g. Honda VTEC) switches between different cam lobes or twists the camshaft to change engine character on the fly.",
  },
  {
    id: "intakeValve",
    name: "Intake Valves",
    category: "Valvetrain",
    tagline: "Doors that let the fresh charge in",
    description:
      "Intake valves open during the intake stroke to let air and fuel into the cylinder, then snap shut and seal tightly so the mixture can be compressed and burned.",
    howItWorks: [
      "A cam lobe pushes the valve down, opening a gap around its head.",
      "A stiff coil spring pulls it closed again when the lobe rotates away.",
      "Intake valves are larger than exhaust valves to help the engine breathe in.",
    ],
    facts: [
      { label: "Per cylinder here", value: "2" },
      { label: "Typical lift", value: "8–12 mm" },
      { label: "Opens", value: "Just before TDC (intake stroke)" },
    ],
    didYouKnow:
      "Some Formula 1 engines use compressed-air (pneumatic) valve springs because metal springs can't keep up at 15,000+ RPM.",
  },
  {
    id: "exhaustValve",
    name: "Exhaust Valves",
    category: "Valvetrain",
    tagline: "Let the burnt gas out",
    description:
      "Exhaust valves open near the end of the power stroke to let the hot, burnt gases escape as the piston rises during the exhaust stroke.",
    howItWorks: [
      "Open slightly before bottom dead centre so pressure can 'blow down'.",
      "Close slightly after top dead centre for better scavenging.",
      "They run glowing hot — often 700 °C or more.",
    ],
    facts: [
      { label: "Per cylinder here", value: "2" },
      { label: "Material", value: "Heat-resistant steel alloys" },
    ],
    didYouKnow:
      "High-performance exhaust valves can have hollow stems filled with sodium, which melts and sloshes to carry heat away from the valve head.",
  },
  {
    id: "sparkPlug",
    name: "Spark Plugs",
    category: "Fuel & ignition",
    tagline: "The lightning bolt that starts the fire",
    description:
      "A spark plug creates a tiny, extremely hot electric spark between two electrodes, igniting the compressed air-fuel mixture just before the piston reaches the top of the compression stroke.",
    howItWorks: [
      "An ignition coil steps 12 V up to 20,000–40,000 V.",
      "The spark jumps a gap of about 0.7–1.1 mm.",
      "It fires a few degrees before TDC because the flame needs time to spread.",
    ],
    facts: [
      { label: "Spark voltage", value: "20–40 kV" },
      { label: "Fires every", value: "2 crank revolutions" },
      { label: "Insulator", value: "Alumina ceramic" },
    ],
    didYouKnow:
      "Diesel engines have no spark plugs — they compress air so much that it gets hot enough to ignite the fuel on its own.",
  },
  {
    id: "fuelInjector",
    name: "Fuel Injectors",
    category: "Fuel & ignition",
    tagline: "Precision fuel misters",
    description:
      "Fuel injectors are electronically controlled nozzles that spray a fine mist of fuel into the intake air. The engine computer decides exactly how long each one opens for.",
    howItWorks: [
      "A solenoid lifts a tiny needle to open the nozzle for a few milliseconds.",
      "Fine atomisation helps the fuel evaporate and mix with air.",
      "The ideal petrol mixture is about 14.7 parts air to 1 part fuel by mass.",
    ],
    facts: [
      { label: "Type shown", value: "Port injection" },
      { label: "Fuel pressure", value: "3–4 bar (port), up to 350 bar (direct)" },
    ],
    didYouKnow:
      "Before injectors became common, carburettors used the venturi effect — like a perfume atomiser — to suck fuel into the air stream.",
  },
  {
    id: "timingBelt",
    name: "Timing Belt",
    category: "Valvetrain",
    tagline: "Keeps the valves in step with the pistons",
    description:
      "The toothed timing belt links the crankshaft to the camshafts so the valves always open in perfect sync with piston position. The cam pulleys are twice the size, so they turn at half speed.",
    howItWorks: [
      "Teeth prevent any slipping — timing must stay exact.",
      "The small crank sprocket drives the larger cam sprockets 2:1.",
      "Some engines use a metal chain or gears instead.",
    ],
    facts: [
      { label: "Material", value: "Reinforced rubber with fibre cords" },
      { label: "Replacement", value: "Typically every 100,000 km" },
    ],
    didYouKnow:
      "On an \"interference\" engine, a snapped timing belt lets pistons smash into open valves — an expensive failure.",
  },
  {
    id: "flywheel",
    name: "Flywheel",
    category: "Rotating & reciprocating",
    tagline: "Smooths out the pulses",
    description:
      "The heavy flywheel bolted to the back of the crankshaft stores rotational energy. It carries the engine smoothly through the non-power strokes and provides a surface for the clutch.",
    howItWorks: [
      "Its inertia evens out the jerky power pulses from each cylinder.",
      "The toothed ring gear around its edge is turned by the starter motor.",
      "The clutch presses against its face to connect engine and gearbox.",
    ],
    facts: [
      { label: "Material", value: "Cast iron or steel" },
      { label: "Ring gear", value: "~100–150 teeth" },
    ],
    didYouKnow:
      "Single-cylinder engines need a relatively huge flywheel because only one power stroke happens every two revolutions.",
  },
  {
    id: "intakeManifold",
    name: "Intake Manifold",
    category: "Breathing",
    tagline: "Delivers air to each cylinder",
    description:
      "The intake manifold distributes incoming air from the throttle body into each cylinder's intake port through individual runners.",
    howItWorks: [
      "The throttle valve controls how much air enters — this is what your accelerator pedal does.",
      "The plenum acts as a reservoir so every runner gets an equal share.",
      "Runner length is tuned to use pressure waves that help cram in more air.",
    ],
    facts: [
      { label: "Material", value: "Aluminium or composite plastic" },
      { label: "Runners shown", value: "4" },
    ],
    didYouKnow:
      "Some engines have variable-length intake runners that switch at a certain RPM to boost torque across the rev range.",
  },
  {
    id: "exhaustManifold",
    name: "Exhaust Manifold",
    category: "Breathing",
    tagline: "Collects the hot exhaust gases",
    description:
      "The exhaust manifold (or header) collects burnt gases from each cylinder's exhaust port and funnels them into a single pipe toward the catalytic converter and muffler.",
    howItWorks: [
      "Each pipe (primary) connects to one exhaust port.",
      "The primaries merge in a collector.",
      "Equal-length headers help exhaust pulses pull the next pulse out (scavenging).",
    ],
    facts: [
      { label: "Gas temperature", value: "Up to ~900 °C" },
      { label: "Material", value: "Cast iron or stainless steel" },
    ],
    didYouKnow:
      "Under hard use, exhaust manifolds can literally glow cherry-red in the dark.",
  },
];

export const PART_BY_ID = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<
  PartId,
  PartInfo
>;

/** Parts that are part of the engine's outer shell (clipped in cutaway, faded in X-ray). */
export const HOUSING: PartId[] = [
  "block",
  "head",
  "valveCover",
  "oilPan",
  "intakeManifold",
  "exhaustManifold",
];
