"use client";

import { AppLink as Link } from "@/components/app-link";
import { useMemo, useState } from "react";
import { createLead } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { SOURCES } from "@/lib/format";
import { fieldClass } from "@/lib/ui";

type CompanyOption = { id: string; name: string };
type ContactOption = { id: string; name: string; title: string | null; companyId: string | null };

export function NewLeadForm({
  companies,
  contacts,
  labels,
  sourceLabels,
}: {
  companies: CompanyOption[];
  contacts: ContactOption[];
  labels: {
    title: string;
    company: string;
    contact: string;
    value: string;
    source: string;
    create: string;
    noContact: string;
    addContact: string;
    beforeLead: string;
  };
  sourceLabels: Record<(typeof SOURCES)[number], string>;
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const visibleContacts = useMemo(
    () => contacts.filter((contact) => contact.companyId === companyId),
    [contacts, companyId],
  );

  return (
    <form action={createLead} className="space-y-4">
      <FormPending />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{labels.title}</span>
        <input name="title" required minLength={2} maxLength={160} className={fieldClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{labels.company}</span>
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
        <span className="mb-1 block text-muted">{labels.contact}</span>
        {visibleContacts.length === 0 ? (
          <p className="rounded-xl border border-line bg-mist px-3 py-2 text-sm text-muted">
            {labels.noContact}{" "}
            <Link href="/contacts/new" className="text-brand">
              {labels.addContact}
            </Link>{" "}
            {labels.beforeLead}
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
          <span className="mb-1 block text-muted">{labels.value}</span>
          <input name="valueThb" type="number" min={0} step={1} defaultValue={0} required className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{labels.source}</span>
          <select name="source" defaultValue="MANUAL" className={fieldClass}>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <BlobButton tone="action" disabled={visibleContacts.length === 0}>
        {labels.create}
      </BlobButton>
    </form>
  );
}
