"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { LoadingPanel } from "@/components/loading-panel";

export function FormPending() {
  const { pending } = useFormStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pending || !mounted) return null;
  return createPortal(<LoadingPanel />, document.body);
}
