import Link from "next/link";
import { NewLeadForm } from "@/components/new-lead-form";
import { listCompaniesAndContacts } from "@/lib/crm";
import { cardClass } from "@/lib/ui";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { companies, contacts } = await listCompaniesAndContacts();
  const message =
    error === "contact"
      ? "Choose a contact that belongs to the selected company."
      : error === "invalid"
        ? "Check the title, value, and source, then try again."
        : null;

  return (
    <main className="max-w-xl">
      <Link href="/leads" className="text-sm text-brand">
        Back to leads
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">New lead</h1>
      <p className="mt-1 text-sm text-muted">The lead starts in New and is owned by you.</p>
      {message ? <p className="mt-4 text-sm text-red-800">{message}</p> : null}
      <div className={`mt-6 p-5 ${cardClass}`}>
        {companies.length === 0 ? (
          <p className="text-sm text-muted">Add a company before creating a lead.</p>
        ) : (
          <NewLeadForm companies={companies} contacts={contacts} />
        )}
      </div>
    </main>
  );
}
