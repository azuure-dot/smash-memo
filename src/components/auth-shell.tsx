import Link from "next/link";
import { BrandLogo } from "./brand-logo";

/** Centered card layout shared by the sign-in, forgot-password and reset-password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  /** Visible heading under the logo. Omit it when the logo itself says it all (sign-in page). */
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand opacity-15 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block" aria-label="Smash Memo home">
            <BrandLogo className="h-20" />
          </Link>
          {title ? (
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          ) : (
            <h1 className="sr-only">Smash Memo</h1>
          )}
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/privacy" className="hover:text-fg">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand-from";

export const primaryButtonClass =
  "w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60";
