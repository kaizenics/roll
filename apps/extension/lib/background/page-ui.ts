import { browser } from "wxt/browser";
import { getRuntime, updateRuntime } from "./state";

/**
 * Injects the camera bubble and recording controls into a tab. Both scripts
 * are runtime-registered and idempotent, so re-injecting after a navigation is safe.
 * Restricted pages (chrome://, the Web Store) reject injection; recording still works.
 */
export async function injectPageUi(tabId: number, withCamera: boolean): Promise<boolean> {
  const files = withCamera
    ? (["/content-scripts/controls.js", "/content-scripts/camera.js"] as const)
    : (["/content-scripts/controls.js"] as const);
  try {
    await browser.scripting.executeScript({ target: { tabId }, files: [...files] });
  } catch (error) {
    console.info(`Roll UI not injected into tab ${tabId}`, error);
    return false;
  }
  const { uiTabIds } = getRuntime();
  if (!uiTabIds.includes(tabId)) await updateRuntime({ uiTabIds: [...uiTabIds, tabId] });
  return true;
}

export async function forgetTab(tabId: number): Promise<void> {
  const { uiTabIds } = getRuntime();
  if (uiTabIds.includes(tabId)) {
    await updateRuntime({ uiTabIds: uiTabIds.filter((id) => id !== tabId) });
  }
}

/** Content scripts unmount themselves on the idle broadcast; just stop tracking tabs. */
export async function clearPageUi(): Promise<void> {
  await updateRuntime({ uiTabIds: [] });
}
