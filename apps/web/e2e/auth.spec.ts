import { expect, test } from "@playwright/test";

test("login page renders magic link and Google options", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to Roll" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("dashboard redirects anonymous users to login and keeps ?next", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
});

test("extension connect page requires login", async ({ page }) => {
  await page.goto("/extension/connect");
  await expect(page).toHaveURL(/\/login\?next=%2Fextension%2Fconnect$/);
});

test("landing page links to the extension and dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Add to Chrome/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to dashboard" })).toBeVisible();
});
