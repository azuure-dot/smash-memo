import { AppHeader } from "@/components/app-header";

/** Shell for every signed-in page. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-6 sm:px-6 sm:pt-8">
        {children}
      </main>
    </>
  );
}
