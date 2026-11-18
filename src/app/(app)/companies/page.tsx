import { AppLink as Link } from "@/components/app-link";
import { BlobLink } from "@/components/blob-button";
import { listCompanies } from "@/lib/crm";
import { countText, getLocale, t } from "@/lib/i18n";
import { companiesByIndustry, industries } from "@/lib/industries";
import { cardClass } from "@/lib/ui";

export default async function CompaniesPage() {
  const companies = await listCompanies();
  const locale = await getLocale();
  const grouped = industries.map((industry) => {
    const names = companiesByIndustry[industry];
    return {
      industry,
      companies: names.flatMap((name) => companies.filter((company) => company.name === name)),
    };
  });

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "companies.title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t(locale, "companies.summary", { count: companies.length, industries: industries.length })}
          </p>
        </div>
        <BlobLink href="/companies/new">{t(locale, "companies.add")}</BlobLink>
      </div>
      <div className="mt-8 space-y-8">
        {grouped.map((group) => (
          <section key={group.industry}>
            <h2 className="text-lg font-medium text-brand">{group.industry}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {group.companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className={`block p-4 ${cardClass}`}>
                  <p className="font-medium">{company.name}</p>
                  <p className="mt-3 text-sm text-muted">
                    {countText(locale, "contact", company._count.contacts)} · {countText(locale, "lead", company._count.leads)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}