import { parseSource, parseStage } from "@/lib/format";
import type { LeadFilters } from "@/lib/crm";

export function readFilters(params: { q?: string; stage?: string; source?: string }): LeadFilters {
  return {
    q: params.q?.trim() || undefined,
    stage: parseStage(params.stage) ?? undefined,
    source: parseSource(params.source) ?? undefined,
  };
}
