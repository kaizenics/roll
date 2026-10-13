import type { SessionUser } from "@roll/shared";
import { browser } from "wxt/browser";
import { DASHBOARD_URL } from "@/lib/env";
import { sendToBackground } from "@/lib/messaging";

export function Header({
  user,
  onSignedOut,
}: {
  user: SessionUser | null;
  onSignedOut: () => void;
}) {
  const label = user?.name ?? user?.email ?? "";
  return (
    <header className="flex items-center gap-3 border-b border-stone-200 px-4 py-3 dark:border-stone-800">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-full bg-stone-900 dark:bg-stone-100"
      >
        <span className="bg-record size-2.5 rounded-full" />
      </span>
      <span className="font-semibold">Roll</span>
      {user && (
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="size-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold dark:bg-stone-700">
              {label.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="max-w-28 truncate text-sm" title={label}>
            {label}
          </span>
          <button
            type="button"
            className="rounded text-xs text-stone-500 hover:underline"
            onClick={async () => {
              await sendToBackground({ target: "background", type: "SIGN_OUT" });
              onSignedOut();
            }}
          >
            Sign out
          </button>
        </div>
      )}
      {!user && (
        <button
          type="button"
          className="ml-auto rounded text-xs text-stone-500 hover:underline"
          onClick={() => void browser.tabs.create({ url: DASHBOARD_URL })}
        >
          Open Roll
        </button>
      )}
    </header>
  );
}
