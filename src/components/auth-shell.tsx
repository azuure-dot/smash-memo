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
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block" aria-label="Smash Memo home">
            <BrandLogo className="h-20" />
          </Link>
          {title ? (
            <h1 className="text-balance font-serif text-2xl font-semibold tracking-tight">{title}</h1>
          ) : (
            <h1 className="sr-only">Smash Memo</h1>
          )}
          {subtitle && <p className="mt-1 text-balance text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/privacy" className="underline decoration-dashed underline-offset-4 transition-colors hover:text-fg">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}

/** A line to write on (no box): the pencil line turns to ink while typing. */
export const fieldClass =
  "w-full border-0 border-b border-line bg-transparent px-1 py-2 text-base outline-none transition-colors placeholder:text-muted focus:border-fg/60";

/** Sheet of paper holding an auth form. */
export const authCardClass = "paper rounded-lg p-5 sm:p-6";

export const primaryButtonClass =
  "w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-on-brand transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.99] disabled:opacity-60";
