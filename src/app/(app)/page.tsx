import Link from "next/link";
import { Filters } from "@/components/filters";
import { StageBadge } from "@/components/stage-badge";
import { listLeads } from "@/lib/crm";
import { readFilters } from "@/lib/filters";
import { STAGES, formatThb, sourceLabel, stageLabel } from "@/lib/format";
import { accentButtonClass, cardClass } from "@/lib/ui";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; source?: string }>;
}) {
  const params = await searchParams;
  const filters = readFilters(params);
  const leads = await listLeads(filters);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">{leads.length} matching leads</p>
        </div>
        <Link href="/leads/new" className={accentButtonClass}>
          New lead
        </Link>
      </div>
      <div className="mt-5">
        <Filters action="/" q={params.q ?? ""} stage={params.stage ?? ""} source={params.source ?? ""} />
      </div>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const column = leads.filter((lead) => lead.stage === stage);
          return (
            <section key={stage} className="w-72 shrink-0 rounded-2xl border border-line bg-white/75 p-3">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">{stageLabel(stage)}</h2>
                <span className="text-xs text-muted">{column.length}</span>
              </header>
              <div className="space-y-2">
                {column.length === 0 ? <p className="text-sm text-muted">No leads</p> : null}
                {column.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className={`block p-3 ${cardClass}`}
                  >
                    <StageBadge stage={lead.stage} />
                    <p className="mt-2 text-sm font-medium">{lead.title}</p>
                    <p className="mt-1 text-sm text-muted">{lead.company?.name ?? "No company"}</p>
                    <p className="mt-2 text-xs text-muted">
                      {formatThb(lead.valueThb)} · {sourceLabel(lead.source)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
