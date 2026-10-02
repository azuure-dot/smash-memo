import Link from "next/link";

export default function SharedNoteNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-5 py-24 text-center">
      <h1 className="text-xl font-semibold">This note isn&apos;t available</h1>
      <p className="text-sm text-muted">The link may be wrong, or its author stopped sharing it or deleted it.</p>
      <Link href="/" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white">
        Go to Smash Memo
      </Link>
    </main>
  );
}
