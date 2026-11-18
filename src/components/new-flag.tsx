"use client";

import { useEffect, useState } from "react";

const remembered = new Set<string>();

export function NewFlag({ messageId, unseen, label }: { messageId: string; unseen: boolean; label: string }) {
  const [on, setOn] = useState(unseen);

  useEffect(() => {
    if (unseen) remembered.add(messageId);
    setOn(unseen || remembered.has(messageId));
  }, [messageId, unseen]);

  if (!on) return null;
  return (
    <span className="ml-2 inline-flex rounded-full bg-brand px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

export function MarkSeen({ leadId, enabled }: { leadId: string; enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    void fetch(`/api/leads/${leadId}/seen`, { method: "POST" });
  }, [leadId, enabled]);
  return null;
}
