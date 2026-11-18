"use client";

import { useState } from "react";
import type { LeadStage } from "@prisma/client";
import { updateStage } from "@/app/actions";
import { STAGES, stageLabel } from "@/lib/format";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

export function StageForm({
  leadId,
  stage,
  lostReason,
}: {
  leadId: string;
  stage: LeadStage;
  lostReason: string | null;
}) {
  const [nextStage, setNextStage] = useState<LeadStage>(stage);

  return (
    <form action={updateStage} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Stage</span>
        <select
          name="stage"
          value={nextStage}
          onChange={(event) => setNextStage(event.target.value as LeadStage)}
          className={fieldClass}
        >
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {stageLabel(item)}
            </option>
          ))}
        </select>
      </label>
      {nextStage === "LOST" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Why was it lost?</span>
          <input name="lostReason" required defaultValue={lostReason ?? ""} className={fieldClass} />
        </label>
      ) : null}
      <button className={primaryButtonClass}>Save stage</button>
    </form>
  );
}
