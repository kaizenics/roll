import { sendToBackground } from "@/lib/messaging";
import { Button } from "./ui";

export function SignIn() {
  return (
    <section className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <h1 className="text-lg font-semibold">Record and share in seconds</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Sign in to Roll to start recording your screen, camera and voice.
      </p>
      <Button
        className="w-full"
        onClick={async () => {
          await sendToBackground({ target: "background", type: "SIGN_IN" });
          window.close();
        }}
      >
        Sign in
      </Button>
    </section>
  );
}
