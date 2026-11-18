"use client";

import type { ComponentProps, ReactNode } from "react";
import { AppLink } from "@/components/app-link";

function BlobParts() {
  return (
    <span className="blob-btn__inner" aria-hidden="true">
      <span className="blob-btn__blobs">
        <span className="blob-btn__blob" />
        <span className="blob-btn__blob" />
        <span className="blob-btn__blob" />
        <span className="blob-btn__blob" />
      </span>
    </span>
  );
}

export function BlobButton({
  tone,
  className = "",
  children,
  ...props
}: {
  tone: "auth" | "action";
  className?: string;
  children: ReactNode;
} & ComponentProps<"button">) {
  return (
    <button className={`tone-blob tone-blob--${tone} ${className}`} {...props}>
      {children}
      <BlobParts />
    </button>
  );
}

export function BlobLink({
  className = "",
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & ComponentProps<typeof AppLink>) {
  return (
    <AppLink className={`tone-blob tone-blob--header ${className}`} {...props}>
      {children}
      <BlobParts />
    </AppLink>
  );
}
