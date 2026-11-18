import Link from "next/link";
import { createContact } from "@/app/actions";
import { listCompanies } from "@/lib/crm";
import { cardClass, fieldClass, primaryButtonClass } from "@/lib/ui";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const companies = await listCompanies();
  const message =
    error === "duplicate"
      ? "That email is already used by another contact."
      : error === "company"
        ? "Choose a company that exists in the CRM."
        : error === "invalid"
          ? "Check the name, email, and phone, then try again."
          : null;

  return (
    <main className="max-w-xl">
      <Link href="/contacts" className="text-sm text-brand">
        Back to contacts
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">New contact</h1>
      <p className="mt-1 text-sm text-muted">A lead needs a contact at its company.</p>
      {message ? <p className="mt-4 text-sm text-red-800">{message}</p> : null}
      <form action={createContact} className={`mt-6 space-y-4 p-5 ${cardClass}`}>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Name</span>
          <input name="name" required minLength={2} maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Position</span>
          <input name="title" maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Company</span>
          <select name="companyId" required className={fieldClass}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Email</span>
          <input name="email" type="email" className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Phone</span>
          <input name="phone" maxLength={40} className={fieldClass} />
        </label>
        <button className={primaryButtonClass}>Save contact</button>
      </form>
    </main>
  );
}
