import { expect, test } from "@playwright/test";

test.describe("viewer page", () => {
  test("shows a processing state that keeps polling", async ({ page }) => {
    await page.goto("/v/prcss23456");
    await expect(page.getByRole("heading", { name: "Still processing" })).toBeVisible();
    await expect(page.getByText("Processing…")).toBeVisible();
    await expect(
      page.getByText("This page updates automatically.", { exact: false }),
    ).toBeVisible();
  });

  test("renders the player and rich preview tags when ready", async ({ page }) => {
    await page.goto("/v/rdy2345678");
    await expect(
      page.getByRole("heading", { name: "Quarterly roadmap walkthrough" }),
    ).toBeVisible();
    await expect(page.locator("mux-player")).toHaveCount(1);
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("7 views")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy link" })).toBeVisible();
    // Owner-only controls are hidden from anonymous viewers.
    await expect(page.getByRole("button", { name: "Rename" })).toHaveCount(0);

    const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
    expect(await meta('meta[property="og:title"]')).toBe("Quarterly roadmap walkthrough");
    expect(await meta('meta[property="og:image"]')).toContain(
      "image.mux.com/playbackid123/thumbnail.jpg",
    );
    expect(await meta('meta[property="og:video"]')).toBe(
      "https://stream.mux.com/playbackid123/highest.mp4",
    );
    expect(await meta('meta[name="twitter:card"]')).toBe("player");
  });

  test("shows an error state for failed videos", async ({ page }) => {
    await page.goto("/v/errd234567");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("couldn’t be processed");
  });

  test("hides private videos from everyone but the owner", async ({ page }) => {
    const response = await page.goto("/v/prvt234567");
    expect(response?.status()).toBe(404);
    expect((await page.goto("/embed/prvt234567"))?.status()).toBe(404);
  });

  test("serves a bare player for embeds of shared videos", async ({ page }) => {
    const response = await page.goto("/embed/rdy2345678");
    expect(response?.status()).toBe(200);
    await expect(page.locator("mux-player")).toHaveCount(1);
  });

  test("returns 404 for unknown links", async ({ page }) => {
    const response = await page.goto("/v/zzzzzzzzzz");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Video not found" })).toBeVisible();
  });
});
