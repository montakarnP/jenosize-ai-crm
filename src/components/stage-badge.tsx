import type { LeadStage } from "@prisma/client";
import { stageLabel } from "@/lib/format";

const tones: Record<LeadStage, string> = {
  NEW: "bg-mist text-brand",
  QUALIFIED: "bg-brand text-white",
  PROPOSAL: "bg-[#e7fbff] text-[#06758c]",
  WON: "bg-emerald-50 text-emerald-800",
  LOST: "bg-slate-100 text-slate-500",
};

export function StageBadge({ stage, label }: { stage: LeadStage; label?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[stage]}`}>
      {label ?? stageLabel(stage)}
    </span>
  );
}
