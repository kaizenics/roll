import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" aria-label="Roll home">
        <Logo />
      </Link>
      <article className="text-muted-foreground mt-10 space-y-4 text-sm leading-relaxed [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-medium">
        <h1 className="text-foreground font-serif text-4xl">Terms of Service</h1>
        <p>Last updated: November 1, 2026</p>
        <p>
          By using Roll (the website at roll.kaizenics.dev and the Roll browser extension) you agree
          to these terms.
        </p>

        <h2>Your content</h2>
        <p>
          You own the recordings you make. You give us permission to store, process and display them
          only as needed to run Roll and share them with people you send the link to.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Don&apos;t use Roll to record people without their consent where the law requires it, or
          to upload illegal, infringing, or abusive content. We may remove content or suspend
          accounts that break these rules.
        </p>

        <h2>Availability</h2>
        <p>
          Roll is provided &quot;as is&quot;, without warranties. We may change or discontinue
          features, and we are not liable for lost recordings or indirect damages to the extent
          permitted by law.
        </p>

        <h2>Privacy</h2>
        <p>
          See our{" "}
          <Link href="/privacy" className="text-foreground underline">
            Privacy Policy
          </Link>{" "}
          for how we handle your data.
        </p>

        <h2>Contact</h2>
        <p>
          <a href="mailto:privacy@kaizenics.dev" className="text-foreground underline">
            privacy@kaizenics.dev
          </a>
        </p>
      </article>
    </main>
  );
}
