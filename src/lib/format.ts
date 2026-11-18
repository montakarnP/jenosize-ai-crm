import type { LeadSource, LeadStage } from "@prisma/client";

export const STAGES: LeadStage[] = ["NEW", "QUALIFIED", "PROPOSAL", "WON", "LOST"];
export const SOURCES: LeadSource[] = ["WEBSITE", "MANUAL", "LINE"];

const stageLabels: Record<LeadStage, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  WON: "Won",
  LOST: "Lost",
};

const sourceLabels: Record<LeadSource, string> = {
  WEBSITE: "Website",
  MANUAL: "Manual",
  LINE: "LINE",
};

export function stageLabel(stage: LeadStage): string {
  return stageLabels[stage];
}

export function sourceLabel(source: LeadSource): string {
  return sourceLabels[source];
}

export function formatThb(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function formatWhen(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(value);
}

export function parseStage(value: unknown): LeadStage | null {
  return STAGES.includes(value as LeadStage) ? (value as LeadStage) : null;
}

export function parseSource(value: unknown): LeadSource | null {
  return SOURCES.includes(value as LeadSource) ? (value as LeadSource) : null;
}
