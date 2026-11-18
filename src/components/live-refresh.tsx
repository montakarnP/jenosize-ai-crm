"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function fieldIsFocused(): boolean {
  const active = document.activeElement;
  return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
}

function onLeadDetail(): boolean {
  return /^\/leads\/[^/]+$/.test(window.location.pathname);
}

type Inbox = { stream: string; unread: string };

export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let seen: Inbox | null = null;
    let waiting: Inbox | null = null;
    let stopped = false;

    function apply(next: Inbox) {
      const streamChanged = seen?.stream !== next.stream;
      const unreadChanged = seen?.unread !== next.unread;
      seen = next;
      waiting = null;
      if (streamChanged || (unreadChanged && !onLeadDetail())) router.refresh();
    }

    async function look() {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/inbox/revision", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { data?: { stream?: unknown; unread?: unknown } };
        if (typeof body.data?.stream !== "string" || typeof body.data.unread !== "string") return;
        const next = { stream: body.data.stream, unread: body.data.unread };
        if (seen === null) {
          seen = next;
          return;
        }
        if (seen.stream === next.stream && seen.unread === next.unread) return;
        if (fieldIsFocused()) {
          waiting = next;
          return;
        }
        apply(next);
      } catch {
        return;
      }
    }

    function onFocusOut() {
      if (!waiting || (waiting.stream === seen?.stream && waiting.unread === seen?.unread)) return;
      apply(waiting);
    }

    const timer = window.setInterval(() => void look(), 2000);
    void look();
    document.addEventListener("focusout", onFocusOut);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [router]);

  return null;
}
