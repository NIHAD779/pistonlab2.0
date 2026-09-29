"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Engine Explorer" },
  { href: "/cycle", label: "4-Stroke Lab" },
  { href: "/quiz", label: "Quiz" },
];

export default function NavBar() {
  const path = usePathname();
  return (
    <header className="nav">
      <Link href="/" className="brand">
        <span className="brand-mark">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <rect x="6" y="3" width="12" height="8" rx="1.5" fill="currentColor" />
            <rect x="6" y="12.5" width="12" height="1.5" rx=".75" fill="currentColor" opacity=".7" />
            <path d="M12 14v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="12" cy="19.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>
        Piston<b>Lab</b>
      </Link>
      <nav>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
