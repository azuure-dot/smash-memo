import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SITE } from "@/lib/site-config";

export const metadata = { title: "Privacy" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-fg/85">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-[calc(env(safe-area-inset-top)+2rem)]">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
        aria-label="Back to Smash Memo"
      >
        <ArrowLeft className="size-4" /> <BrandLogo />
      </Link>

      <h1 className="font-serif text-4xl font-semibold tracking-tight">
        Privacy <span className="text-brand">&amp; security</span>
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated {SITE.privacyUpdated}</p>

      <div className="paper mt-6 rounded-lg p-5 text-sm leading-relaxed sm:p-6">
        <p className="font-medium">The short version</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-fg/85">
          <li>We store your email address and the notes you write. Nothing else about you.</li>
          <li>No ads, no analytics, no tracking cookies. Your data is never sold or shared for marketing.</li>
          <li>
            Your notes are private. If you share one, anyone with its link can read it, until you stop sharing it.
          </li>
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
              <strong>Profile (optional):</strong> a username and a profile picture, if you choose to add them. The
              picture is cropped and resized on your device before upload, and the original file is never sent.
            </li>
            <li>
              <strong>Your content:</strong> matchups, stage preferences, pre-set reminders, notes and video links, with the dates they
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
          <p>
            Notes can include YouTube videos. Until you press play, only the video&apos;s thumbnail image is loaded
            from YouTube. Pressing play loads YouTube&apos;s player in its privacy-enhanced mode
            (youtube-nocookie.com); from then on, YouTube&apos;s own privacy policy applies to that video.
          </p>
          <p>
            Notes can also show images from other websites. Smash Memo only stores the image&apos;s link, never the
            image itself. When you view a note with such an image, your browser loads it directly from the website
            that hosts it, which can see your IP address like for any image on the web. If that website removes
            the image, it stops showing in the note.
          </p>
        </Section>

        <Section title="Who can see your data">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Other users: only notes you share.</strong> Access rules are enforced by the database itself,
              which only returns rows that belong to the signed-in account.
            </li>
            <li>
              <strong>Shared notes:</strong> when you tap &ldquo;Share&rdquo; on a note, anyone who has its link, signed
              in or not, can read that note (stages, pre-set reminder, notes and videos). They can also save a bookmark to it or
              duplicate it into their own account; a duplicate is their own copy and is not affected if you later edit,
              stop sharing or delete yours. A shared note shows your username and profile picture as its author
              (or &ldquo;Anonymous player&rdquo; if you haven&apos;t set them); your email address is never shown.
              Shared notes are never listed publicly or shown to search engines, and profiles can&apos;t be browsed.
              Profile pictures are stored as public files: anyone who has a picture&apos;s exact address can view
              it. Tap &ldquo;Stop sharing&rdquo; at any time to make the link stop
              working.
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
            Smash Memo is a small independent project and has not been professionally audited. Please don&apos;t use
            it to store sensitive personal information.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Your data is kept until you delete it. Deleting a matchup removes it immediately. Deleting your account
            (from the <Link href="/account" className="text-brand-from hover:underline">Account</Link> page) immediately
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
                <a href={`mailto:${SITE.contactEmail}`} className="text-brand-from hover:underline">
                  {SITE.contactEmail}
                </a>
                .
              </>
            ) : null}
          </p>
          <p>If you are in the EU, you also have the right to lodge a complaint with your data protection authority.</p>
        </Section>

        <Section title="Trademarks">
          <p>
            Smash Memo is an independent fan-made tool. It is not affiliated with, endorsed or sponsored by Nintendo,
            HAL Laboratory, Sora Ltd. or Aether Studios. Super Smash Bros. Ultimate, Super Smash Bros. Melee and
            Rivals of Aether II, their logos and character icons are trademarks or copyrights of their respective
            owners, and are only used to identify which game and characters a note is about.
          </p>
        </Section>

        <Section title="Changes">
          <p>If this page changes in a meaningful way, the date at the top will be updated.</p>
        </Section>
      </div>
    </main>
  );
}
