import { Suspense } from "react";
import { login } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { BrandMark } from "@/components/brand-mark";
import { DeveloperCredit } from "@/components/developer-credit";
import { FormPending } from "@/components/form-pending";
import { LanguageSwitch } from "@/components/language-switch";
import { getLocale, t } from "@/lib/i18n";
import { fieldClass } from "@/lib/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const message =
    error === "invalid" ? t(locale, "auth.invalid") : error === "config" ? t(locale, "auth.config") : null;

  return (
    <main className="crm-login flex w-full items-center justify-center px-4 py-10">
      <section className="w-full max-w-md border border-line bg-white/90 p-6 shadow-[0_24px_70px_rgba(32,76,213,0.1)] sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <BrandMark />
          <Suspense fallback={null}>
            <LanguageSwitch locale={locale} />
          </Suspense>
        </div>
        <h1 className="mt-8 text-3xl font-medium text-brand">{t(locale, "auth.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{t(locale, "auth.intro")}</p>
        <form action={login} className="mt-8 space-y-4">
          <FormPending />
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t(locale, "auth.email")}</span>
            <input name="email" type="email" autoComplete="username" required className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t(locale, "auth.password")}</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
            />
          </label>
          {message ? <p className="text-sm text-red-700">{message}</p> : null}
          <BlobButton tone="auth" className="w-full">
            {t(locale, "auth.signin")}
          </BlobButton>
        </form>
        <p className="mt-6 text-sm leading-6 text-muted">{t(locale, "auth.demo")}</p>
        <div className="mt-4">
          <DeveloperCredit />
        </div>
      </section>
    </main>
  );
}
