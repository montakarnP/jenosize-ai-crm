import { AppLink as Link } from "@/components/app-link";

export function BackIcon({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="crm-back">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <path
          d="M15 5 8 12l7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
