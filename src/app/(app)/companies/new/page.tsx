import Link from "next/link";
import { createCompany } from "@/app/actions";
import { industries } from "@/lib/industries";
import { cardClass, fieldClass, primaryButtonClass } from "@/lib/ui";

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "duplicate"
      ? "A company with that name is already in the CRM."
      : error === "invalid"
        ? "Enter a company name and choose one of the six industries."
        : null;

  return (
    <main className="max-w-xl">
      <Link href="/companies" className="text-sm text-brand">
        Back to companies
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">New company</h1>
      <p className="mt-1 text-sm text-muted">Use one of the Jenosize industry groups.</p>
      {message ? <p className="mt-4 text-sm text-red-800">{message}</p> : null}
      <form action={createCompany} className={`mt-6 space-y-4 p-5 ${cardClass}`}>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Company name</span>
          <input name="name" required minLength={2} maxLength={160} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Industry</span>
          <select name="industry" required className={fieldClass} defaultValue="Retail">
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <button className={primaryButtonClass}>Save company</button>
      </form>
    </main>
  );
}
