import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main id="main" className="px-4 pb-24 pt-6 sm:px-8">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.04em] outline-none focus-visible:underline"
      >
        <LogoMark className="size-8" />
        Roll
      </Link>
      <article className="text-muted-foreground [&_a]:text-foreground [&_h2]:text-foreground mx-auto mt-16 max-w-3xl space-y-5 text-lg leading-relaxed md:mt-24 [&_a:hover]:text-[#e3181f] [&_a]:underline-offset-4 [&_h2]:mt-14 [&_h2]:border-t [&_h2]:border-t-[#e3181f] [&_h2]:pt-6 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-[-0.03em] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-[#e3181f]">
        <h1 className="text-foreground text-[clamp(3rem,9vw,7.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.065em]">
          Terms of Service
        </h1>
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
