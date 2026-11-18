import { AppLink as Link } from "@/components/app-link";
import { notFound } from "next/navigation";
import { StageBadge } from "@/components/stage-badge";
import { getCompany } from "@/lib/crm";
import { formatThb } from "@/lib/format";
import { getLocale, stageText, t } from "@/lib/i18n";
import { cardClass } from "@/lib/ui";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <main>
      <Link href="/companies" className="text-sm text-brand">
        {t(locale, "companies.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{company.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {company.industry ?? t(locale, "companies.noIndustry")}
        {company.employees != null ? ` · ${t(locale, "companies.people", { count: company.employees })}` : ""}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium">{t(locale, "companies.contacts")}</h2>
          <ul className="mt-3 space-y-2">
            {company.contacts.map((contact) => (
              <li key={contact.id} className={`p-3 text-sm ${cardClass}`}>
                <p className="font-medium">{contact.name}</p>
                <p className="text-muted">{contact.title ?? t(locale, "contacts.noTitle")}</p>
                <p className="text-muted">{contact.email ?? t(locale, "contacts.noEmail")}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-medium">{t(locale, "companies.leads")}</h2>
          <ul className="mt-3 space-y-2">
            {company.leads.map((lead) => (
              <li key={lead.id}>
                <Link href={`/leads/${lead.id}`} className={`block p-3 ${cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">{lead.title}</p>
                    <StageBadge stage={lead.stage} label={stageText(locale, lead.stage)} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {lead.contact?.name ?? t(locale, "common.noContact")} · {formatThb(lead.valueThb)}
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
