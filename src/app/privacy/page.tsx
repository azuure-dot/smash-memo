import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE } from "@/lib/site-config";

export const metadata = { title: "Privacy" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-fg/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
        <ArrowLeft className="size-4" /> Smash Notes
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">
        Privacy <span className="text-brand">&amp; security</span>
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated {SITE.privacyUpdated}</p>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed">
        <p className="font-medium">The short version</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-fg/85">
          <li>We store your email address and the notes you write. Nothing else about you.</li>
          <li>No ads, no analytics, no tracking cookies. Your data is never sold or shared for marketing.</li>
          <li>Other users can never see your notes.</li>
          <li>You can delete your account and everything in it at any time, instantly.</li>
        </ul>
      </div>

      <div className="mt-10 space-y-8">
        <Section title="What we store">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Account:</strong> your email address and your password. The password is stored only as a
              one-way hash by our authentication provider; nobody, including us, can read it.
            </li>
            <li>
              <strong>Your content:</strong> matchups, stage preferences, notes and quick notes, with the dates they
              were created and last edited.
            </li>
            <li>
              <strong>Technical logs:</strong> like any website, our hosting providers keep short-lived server logs
              (such as IP addresses and request times) to run and protect the service.
            </li>
          </ul>
        </Section>

        <Section title="Cookies">
          <p>
            We only use the cookies needed to keep you signed in. There are no advertising or analytics cookies, so
            there is no cookie banner. The app also keeps a copy of recently opened pages on your device so it works
            offline; signing out or deleting your account clears it.
          </p>
        </Section>

        <Section title="Who can see your data">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Other users: never.</strong> Access rules are enforced by the database itself, which only returns
              rows that belong to the signed-in account.
            </li>
            <li>
              <strong>{SITE.operator}:</strong> as the person running the service, the maintainer has technical access
              to the database. It is only used when needed to keep the service running, answer a request from you, or
              comply with the law.
            </li>
            <li>
              <strong>Service providers:</strong> Supabase (database and sign-in) and Vercel (website hosting) process
              data on our behalf and under their own security and privacy commitments.
            </li>
          </ul>
        </Section>

        <Section title="Where your data is stored">
          <p>Your account and notes are stored in a database hosted in {SITE.dataRegion}.</p>
        </Section>

        <Section title="How it's protected">
          <ul className="list-disc space-y-1 pl-5">
            <li>All traffic is encrypted with HTTPS.</li>
            <li>Passwords are hashed and never visible to the app or its maintainer.</li>
            <li>Per-account access rules are enforced inside the database, not just in the interface.</li>
            <li>No administrator key is ever sent to your browser.</li>
          </ul>
          <p>
            Smash Notes is a small independent project and has not been professionally audited. Please don&apos;t use
            it to store sensitive personal information.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Your data is kept until you delete it. Deleting a matchup removes it immediately. Deleting your account
            (from the <Link href="/account" className="text-brand-to hover:underline">Account</Link> page) immediately
            and permanently removes your account and all of your notes. Copies in our providers&apos; short-term system
            logs expire on their own.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on where you live (including under the EU GDPR), you can ask to access, correct, export or erase
            your data, or object to how it is processed. You can erase everything yourself from the Account page.
            {SITE.contactEmail ? (
              <>
                {" "}For anything else, contact{" "}
                <a href={`mailto:${SITE.contactEmail}`} className="text-brand-to hover:underline">
                  {SITE.contactEmail}
                </a>
                .
              </>
            ) : null}
          </p>
          <p>If you are in the EU, you also have the right to lodge a complaint with your data protection authority.</p>
        </Section>

        <Section title="Changes">
          <p>If this page changes in a meaningful way, the date at the top will be updated.</p>
        </Section>
      </div>
    </main>
  );
}
