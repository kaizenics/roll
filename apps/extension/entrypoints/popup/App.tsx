import { browser } from "wxt/browser";
import { DASHBOARD_URL } from "@/lib/env";
import { FailedUploads } from "./components/FailedUploads";
import { Header } from "./components/Header";
import { RecordForm } from "./components/RecordForm";
import { SignIn } from "./components/SignIn";
import { StatusView } from "./components/StatusView";
import { Alert } from "./components/ui";
import { useStatus } from "./hooks/useStatus";

export function App() {
  const { status, loadError, refresh } = useStatus();

  if (!status) {
    return (
      <main className="p-4">
        {loadError ? (
          <Alert>{loadError}</Alert>
        ) : (
          <p className="text-sm text-stone-500">Loading…</p>
        )}
      </main>
    );
  }

  const { state, user, failed } = status;

  return (
    <main>
      <Header user={user} onSignedOut={() => void refresh()} />
      {!user && state.status === "idle" ? (
        <SignIn />
      ) : state.status === "idle" ? (
        <RecordForm />
      ) : (
        <StatusView state={state} />
      )}
      {user && state.status === "idle" && <FailedUploads items={failed} />}
      <footer className="border-t border-stone-200 px-4 py-2 text-center dark:border-stone-800">
        <button
          type="button"
          className="text-brand rounded text-xs hover:underline"
          onClick={() => void browser.tabs.create({ url: DASHBOARD_URL })}
        >
          Open dashboard
        </button>
      </footer>
    </main>
  );
}
