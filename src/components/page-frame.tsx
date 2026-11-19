import type { ReactNode } from "react";
import { AppLink as Link } from "@/components/app-link";
import { NavLinks } from "@/components/nav-links";
import { getLocale, t } from "@/lib/i18n";

export async function PageFrame({
  title,
  hint,
  action,
  aside,
  back,
  children,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  const locale = await getLocale();

  return (
    <>
      <section className="crm-hero">
        <div className="container-fluid">
          <div className="row items-center gy-4">
            <div className={aside ? "col-lg-8" : "col-12"}>
              {back ? (
                <Link href={back.href} className="crm-hero__back">
                  {back.label}
                </Link>
              ) : null}
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="crm-hero__title">{title}</h1>
                  {hint ? <div className="crm-hero__hint">{hint}</div> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
              </div>
            </div>
            {aside ? <div className="col-lg-4">{aside}</div> : null}
          </div>
        </div>
      </section>
      <div className="crm-subnav">
        <div className="container-fluid">
          <NavLinks
            links={[
              { href: "/", label: t(locale, "nav.pipeline") },
              { href: "/leads", label: t(locale, "nav.leads") },
              { href: "/companies", label: t(locale, "nav.companies") },
              { href: "/contacts", label: t(locale, "nav.contacts") },
              { href: "/team", label: t(locale, "nav.team") },
            ]}
          />
        </div>
      </div>
      <div className="container-fluid crm-canvas">{children}</div>
    </>
  );
}
