"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createLead } from "@/app/actions";
import { SOURCES, sourceLabel } from "@/lib/format";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

type CompanyOption = { id: string; name: string };
type ContactOption = { id: string; name: string; title: string | null; companyId: string | null };

export function NewLeadForm({
  companies,
  contacts,
}: {
  companies: CompanyOption[];
  contacts: ContactOption[];
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const visibleContacts = useMemo(
    () => contacts.filter((contact) => contact.companyId === companyId),
    [contacts, companyId],
  );

  return (
    <form action={createLead} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Title</span>
        <input name="title" required minLength={2} maxLength={160} className={fieldClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Company</span>
        <select
          name="companyId"
          value={companyId}
          onChange={(event) => setCompanyId(event.target.value)}
          className={fieldClass}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Contact</span>
        {visibleContacts.length === 0 ? (
          <p className="rounded-xl border border-line bg-mist px-3 py-2 text-sm text-muted">
            This company has no contact yet.{" "}
            <Link href="/contacts/new" className="text-brand">
              Add a contact
            </Link>{" "}
            before creating the lead.
          </p>
        ) : (
          <select name="contactId" className={fieldClass} required>
            {visibleContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
                {contact.title ? ` · ${contact.title}` : ""}
              </option>
            ))}
          </select>
        )}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Value (THB)</span>
          <input name="valueThb" type="number" min={0} step={1} defaultValue={0} required className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Source</span>
          <select name="source" defaultValue="MANUAL" className={fieldClass}>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {sourceLabel(source)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className={`${primaryButtonClass} disabled:cursor-not-allowed disabled:opacity-50`} disabled={visibleContacts.length === 0}>
        Create lead
      </button>
    </form>
  );
}
