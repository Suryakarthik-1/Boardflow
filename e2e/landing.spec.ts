import { test, expect } from "@playwright/test";

/**
 * Smoke test for the marketing landing page. Asserts that the page mounts and
 * the core sections are present, without depending on exact copy.
 */
test("landing page renders hero, sections and footer", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("h1")).toContainText("on one canvas");
  await expect(page.locator(".nav__brand")).toContainText("Boardflow");

  // The section anchors are present regardless of scroll-reveal opacity.
  await expect(page.locator("#product")).toBeVisible();
  await expect(page.locator("#sync")).toBeVisible();
  await expect(page.locator("#about")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});
