import Link from "next/link";
import { notFound } from "next/navigation";
import { StageBadge } from "@/components/stage-badge";
import { getCompany } from "@/lib/crm";
import { formatThb } from "@/lib/format";
import { cardClass } from "@/lib/ui";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <main>
      <Link href="/companies" className="text-sm text-brand">
        Back to companies
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{company.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {company.industry ?? "No industry"}
        {company.employees != null ? ` · ${company.employees} people` : ""}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium">Contacts</h2>
          <ul className="mt-3 space-y-2">
            {company.contacts.map((contact) => (
              <li key={contact.id} className={`p-3 text-sm ${cardClass}`}>
                <p className="font-medium">{contact.name}</p>
                <p className="text-muted">{contact.title ?? "No title"}</p>
                <p className="text-muted">{contact.email ?? "No email"}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-medium">Leads</h2>
          <ul className="mt-3 space-y-2">
            {company.leads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className={`block p-3 ${cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{lead.title}</p>
                    <StageBadge stage={lead.stage} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {lead.contact?.name ?? "No contact"} · {formatThb(lead.valueThb)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
