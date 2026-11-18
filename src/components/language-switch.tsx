"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { setLocale } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const query = search.toString();
  const next = query ? `${pathname}?${query}` : pathname;
  const other: Locale = locale === "en" ? "th" : "en";

  return (
    <form action={setLocale}>
      <input type="hidden" name="next" value={next} />
      <BlobButton tone="auth" name="locale" value={other} className="tone-blob--circle" aria-label={other === "th" ? "ไทย" : "English"}>
        {other === "th" ? "TH" : "EN"}
      </BlobButton>
    </form>
  );
}
