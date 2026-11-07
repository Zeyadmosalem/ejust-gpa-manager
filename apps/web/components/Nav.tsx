"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/plan/", label: "Degree plan" },
  { href: "/tools/", label: "Targets" },
  { href: "/settings/", label: "Data" },
];

export function Nav() {
  const path = usePathname();
  const norm = (p: string) => (p.endsWith("/") ? p : p + "/");
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            Σ
          </span>
          E-JUST GPA
        </Link>
        <nav aria-label="Main">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/semester") : norm(path) === l.href;
            return (
              <Link key={l.href} href={l.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
