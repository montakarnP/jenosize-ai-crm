"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import { LoadingPanel } from "@/components/loading-panel";

function LinkStatus() {
  const { pending } = useLinkStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pending || !mounted) return null;
  return createPortal(<LoadingPanel />, document.body);
}

export function AppLink({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <LinkStatus />
    </NextLink>
  );
}
