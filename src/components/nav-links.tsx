"use client";

import { useEffect, useState } from "react";
import { AppLink as Link } from "@/components/app-link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({
  links,
  menuLabel,
  closeLabel,
}: {
  links: Array<{ href: string; label: string }>;
  menuLabel: string;
  closeLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className={open ? "crm-menu-toggle is-open" : "crm-menu-toggle"}
        aria-label={open ? closeLabel : menuLabel}
        aria-expanded={open}
        aria-controls="crm-mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav id="crm-mobile-menu" className={open ? "crm-menu-panel is-open" : "crm-menu-panel"} hidden={!open}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(pathname, link.href) ? "is-active" : undefined}>
            {link.label}
          </Link>
        ))}
      </nav>
      <nav className="nav-links">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
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
    </>
  );
}
