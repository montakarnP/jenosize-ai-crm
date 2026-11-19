"use client";

import { useState, type ReactNode } from "react";

export function CompanyGroup({
  title,
  showLabel,
  hideLabel,
  children,
}: {
  title: string;
  showLabel: string;
  hideLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section>
      <div className="flex items-center gap-1">
        <h2 className="text-lg font-medium text-brand">{title}</h2>
        <button
          type="button"
          className={open ? "crm-fold" : "crm-fold is-closed"}
          aria-expanded={open}
          aria-label={open ? hideLabel : showLabel}
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {open ? children : null}
    </section>
  );
}
