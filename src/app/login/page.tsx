import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand opacity-15 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">
            SN
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Smash Notes</h1>
          <p className="mt-1 text-sm text-muted">Matchup notes for Ultimate &amp; Melee, on every device.</p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
