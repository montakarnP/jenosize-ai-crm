"use client";

import { useState } from "react";
import type { LeadStage } from "@prisma/client";
import { updateStage } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { STAGES } from "@/lib/format";
import { fieldClass } from "@/lib/ui";

export function StageForm({
  leadId,
  stage,
  lostReason,
  labels,
  stageLabels,
}: {
  leadId: string;
  stage: LeadStage;
  lostReason: string | null;
  labels: { stage: string; whyLost: string; save: string };
  stageLabels: Record<LeadStage, string>;
}) {
  const [nextStage, setNextStage] = useState<LeadStage>(stage);

  return (
    <form action={updateStage} className="space-y-3">
      <FormPending />
      <input type="hidden" name="leadId" value={leadId} />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{labels.stage}</span>
        <select
          name="stage"
          value={nextStage}
          onChange={(event) => setNextStage(event.target.value as LeadStage)}
          className={fieldClass}
        >
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {stageLabels[item]}
            </option>
          ))}
        </select>
      </label>
      {nextStage === "LOST" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{labels.whyLost}</span>
          <input name="lostReason" required defaultValue={lostReason ?? ""} className={fieldClass} />
        </label>
      ) : null}
      <BlobButton tone="action">{labels.save}</BlobButton>
    </form>
  );
}
