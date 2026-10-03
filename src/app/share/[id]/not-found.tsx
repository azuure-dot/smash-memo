import Link from "next/link";

export default function SharedNoteNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-5 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold">This note isn&apos;t available</h1>
      <p className="text-balance text-sm text-muted">The link may be wrong, or its author stopped sharing it or deleted it.</p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-[filter] hover:brightness-110"
      >
        Go to Smash Memo
      </Link>
    </main>
  );
}
