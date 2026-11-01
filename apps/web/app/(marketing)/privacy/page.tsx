import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" aria-label="Roll home">
        <Logo />
      </Link>
      <article className="text-muted-foreground mt-10 space-y-4 text-sm leading-relaxed [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-medium [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-foreground font-serif text-4xl">Privacy Policy</h1>
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
