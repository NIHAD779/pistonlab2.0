import Link from "next/link";
import { HeroScene } from "@/components/dynamic";

const STROKES = [
  { n: "01", name: "Intake", nick: "Suck", color: "#4da3ff", text: "Piston moves down, intake valve opens and air + fuel rush in." },
  { n: "02", name: "Compression", nick: "Squeeze", color: "#b27cff", text: "Valves shut and the piston squeezes the mixture ~10× smaller." },
  { n: "03", name: "Power", nick: "Bang", color: "#ff8a1f", text: "The spark ignites the mixture and the blast drives the piston down." },
  { n: "04", name: "Exhaust", nick: "Blow", color: "#9aa3ad", text: "Exhaust valve opens and the piston pushes the burnt gas out." },
];

const FEATURES = [
  {
    href: "/explore",
    title: "Engine Explorer",
    icon: "⚙️",
    text: "Orbit a fully animated inline-4. Cut it open, X-ray it, explode it and click any of 16 components to learn what it does.",
    cta: "Open the engine",
  },
  {
    href: "/cycle",
    title: "4-Stroke Lab",
    icon: "🔥",
    text: "Zoom into a single cylinder. Watch air and fuel molecules flow in, ignite and leave — with a live pressure-volume diagram.",
    cta: "Start the cycle",
  },
  {
    href: "/quiz",
    title: "Quick Quiz",
    icon: "🏁",
    text: "Ten questions to check you really understand how a combustion engine turns fuel into motion.",
    cta: "Test yourself",
  },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-canvas">
          <HeroScene />
        </div>
        <div className="hero-copy">
          <div className="eyebrow">Interactive 3D engine lab</div>
          <h1>
            See how a <span className="grad">combustion engine</span> really works.
          </h1>
          <p className="lead">
            Thousands of tiny explosions a minute turn fuel into motion. Take a real-time 3D
            engine apart, watch every stroke happen and learn what each component does.
          </p>
          <div className="row gap wrap">
            <Link href="/explore" className="btn primary lg">
              Explore the engine →
            </Link>
            <Link href="/cycle" className="btn lg">
              Watch the 4-stroke cycle
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Suck · Squeeze · Bang · Blow</h2>
        <p className="muted center">
          Every cylinder repeats the same four strokes over two turns of the crankshaft.
        </p>
        <div className="stroke-grid">
          {STROKES.map((s) => (
            <div key={s.n} className="stroke-tile glass" style={{ ["--c" as string]: s.color }}>
              <div className="tile-n">{s.n}</div>
              <div className="tile-anim">
                <div className={`mini-cyl ${s.name.toLowerCase()}`}>
                  <div className="mini-piston" />
                  <div className="mini-gas" />
                </div>
              </div>
              <h3>
                {s.name} <span className="muted">“{s.nick}”</span>
              </h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="feature glass">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <span className="feature-cta">{f.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="footer muted small">
        PistonLab · built with Next.js, Three.js &amp; React Three Fiber · animation is slowed
        down — a real engine at idle turns ~800 times a minute.
      </footer>
    </div>
  );
}
