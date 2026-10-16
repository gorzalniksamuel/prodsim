import { expect, test } from "@playwright/test";

test("home page shows the API as online with its version", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("API online")).toBeVisible();
  await expect(page.getByText("0.1.0.dev0")).toBeVisible();
});
