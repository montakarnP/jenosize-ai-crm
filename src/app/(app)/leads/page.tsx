import Link from "next/link";
import { Filters } from "@/components/filters";
import { StageBadge } from "@/components/stage-badge";
import { listLeads } from "@/lib/crm";
import { readFilters } from "@/lib/filters";
import { formatThb, sourceLabel } from "@/lib/format";
import { accentButtonClass, cardClass } from "@/lib/ui";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; source?: string }>;
}) {
  const params = await searchParams;
  const leads = await listLeads(readFilters(params));

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted">{leads.length} matching leads</p>
        </div>
        <Link href="/leads/new" className={accentButtonClass}>
          New lead
        </Link>
      </div>
      <div className="mt-5">
        <Filters action="/leads" q={params.q ?? ""} stage={params.stage ?? ""} source={params.source ?? ""} />
      </div>
      <div className="mt-6 space-y-3 md:hidden">
        {leads.length === 0 ? <p className="text-sm text-muted">No leads match these filters.</p> : null}
        {leads.map((lead) => (
          <Link key={lead.id} href={`/leads/${lead.id}`} className={`block p-4 ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{lead.title}</p>
              <StageBadge stage={lead.stage} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {lead.company?.name ?? "No company"} · {lead.contact?.name ?? "No contact"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatThb(lead.valueThb)} · {sourceLabel(lead.source)} · {lead.owner?.name ?? "Unassigned"}
            </p>
          </Link>
        ))}
      </div>
      <div className={`mt-6 hidden overflow-hidden md:block ${cardClass}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-mist text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted">
                  No leads match these filters.
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium underline-offset-2 hover:underline">
                    {lead.title}
                  </Link>
                  <p className="text-xs text-muted">{sourceLabel(lead.source)}</p>
                </td>
                <td className="px-4 py-3">{lead.company?.name ?? "—"}</td>
                <td className="px-4 py-3">{lead.contact?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-4 py-3">{formatThb(lead.valueThb)}</td>
                <td className="px-4 py-3">{lead.owner?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
