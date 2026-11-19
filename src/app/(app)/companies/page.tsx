import { AppLink as Link } from "@/components/app-link";
import { BlobLink } from "@/components/blob-button";
import { PageFrame } from "@/components/page-frame";
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
    <PageFrame
      title={t(locale, "companies.title")}
      hint={t(locale, "companies.summary", { count: companies.length, industries: industries.length })}
      action={<BlobLink href="/companies/new">{t(locale, "companies.add")}</BlobLink>}
    >
      <div className="space-y-8">
        {grouped.map((group) => (
          <section key={group.industry}>
            <h2 className="text-lg font-medium text-brand">{group.industry}</h2>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xxl-4 g-3 mt-1">
              {group.companies.map((company) => (
                <div className="col" key={company.id}>
                  <Link href={`/companies/${company.id}`} className={`block h-full p-4 ${cardClass}`}>
                    <p className="font-medium">{company.name}</p>
                    <p className="mt-3 text-sm text-muted">
                      {countText(locale, "contact", company._count.contacts)} · {countText(locale, "lead", company._count.leads)}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}