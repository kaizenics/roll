/**
 * fetch that gives up after `ms`. Supabase clients use it so an unreachable
 * project (paused, DNS gone, network stall) degrades to "signed out" quickly
 * instead of hanging the request until the platform kills it with a 504.
 */
export function timeoutFetch(ms: number): typeof fetch {
  // shortcut: a caller-supplied signal wins and gets no timeout; supabase-js auth
  // calls pass none. Combine with AbortSignal.any once the edge runtime has it.
  return (input, init) =>
    fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(ms) });
}
