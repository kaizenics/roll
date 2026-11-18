import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/logo";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p>Last updated: November 1, 2026</p>
        <p>
          Roll (the website at roll.kaizenics.dev and the Roll browser extension) lets you record
          your screen, a tab or a window, with optional microphone and camera, and share the result
          with a link. This policy explains what we collect and why.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your email address and, if you sign in with
            Google, your name and profile picture.
          </li>
          <li>
            <strong>Authentication data:</strong> a session token so you stay signed in on the
            website and in the extension.
          </li>
          <li>
            <strong>Recordings:</strong> the video and audio you choose to record, plus the title
            and settings you give them. Recordings can include anything that was on your screen or
            picked up by your microphone or camera while recording.
          </li>
          <li>
            <strong>Extension settings:</strong> your mic, camera and capture preferences, stored
            locally in your browser.
          </li>
        </ul>
        <p>
          We only capture your screen, microphone or camera after you start a recording. We do not
          collect your browsing history, keystrokes or the content of pages you are not recording.
        </p>

        <h2>How we use it</h2>
        <p>
          Solely to provide Roll: to sign you in, store and process your recordings, and show them
          to people you share the link with. We do not sell your data, use it for advertising, or
          use it for any purpose unrelated to recording and sharing videos.
        </p>

        <h2>Who processes it</h2>
        <ul>
          <li>
            <strong>Supabase</strong> — account, authentication and recording metadata.
          </li>
          <li>
            <strong>Mux</strong> — video upload, storage and playback.
          </li>
        </ul>
        <p>These providers process data only on our behalf to run the service.</p>

        <h2>Sharing</h2>
        <p>
          A recording is visible to anyone who has its share link. You control which links you send
          and can delete a recording at any time from your dashboard.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Recordings are kept until you delete them. Deleting a recording removes it from Roll and
          our video provider. To delete your account and all associated data, contact us at the
          address below.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests:{" "}
          <a href="mailto:privacy@kaizenics.dev" className="text-foreground underline">
            privacy@kaizenics.dev
          </a>
          .
        </p>
      </article>
    </main>
  );
}
