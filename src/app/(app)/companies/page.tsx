import Link from "next/link";
import { listCompanies } from "@/lib/crm";
import { countLabel } from "@/lib/format";
import { companiesByIndustry, industries } from "@/lib/industries";
import { cardClass, primaryButtonClass } from "@/lib/ui";

export default async function CompaniesPage() {
  const companies = await listCompanies();
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
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-muted">
            {companies.length} companies across {industries.length} industries
          </p>
        </div>
        <Link href="/companies/new" className={primaryButtonClass}>
          Add company
        </Link>
      </div>
      <div className="mt-8 space-y-8">
        {grouped.map((group) => (
          <section key={group.industry}>
            <h2 className="text-lg font-medium text-brand">{group.industry}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className={`block p-4 ${cardClass}`}>
                  <p className="font-medium">{company.name}</p>
                  <p className="mt-3 text-sm text-muted">
                    {countLabel(company._count.contacts, "contact")} · {countLabel(company._count.leads, "lead")}
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