"use client";

import { AppLink as Link } from "@/components/app-link";
import { usePathname } from "next/navigation";

export function NavLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();

  return (
    <nav className="nav-links">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={active ? "blob-btn is-active" : "blob-btn"}>
            {link.label}
            <span className="blob-btn__inner" aria-hidden="true">
              <span className="blob-btn__blobs">
                <span className="blob-btn__blob" />
                <span className="blob-btn__blob" />
                <span className="blob-btn__blob" />
                <span className="blob-btn__blob" />
              </span>
            </span>
          </Link>
        );
      })}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="nav-goo" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" result="mix" />
          </filter>
        </defs>
      </svg>
    </nav>
  );
}
