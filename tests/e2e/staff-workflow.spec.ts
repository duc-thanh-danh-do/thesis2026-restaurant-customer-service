import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/staff-signin");
  await page.getByLabel("Email").fill("staff@testpizza.local");
  await page.getByLabel("Password").fill("staff1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("heading", { name: "Staff workspace" })).toBeVisible();
}

test.describe("Staff Workflow Tests", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*signin|.*login/);
  });

  test("should login and display staff workspace", async ({ page }) => {
    await signIn(page);
    await expect(page.getByPlaceholder("Reply to the guest...")).toBeVisible();
  });

  test("should interact with active tables, send replies, and update statuses", async ({
    page,
  }, testInfo) => {
    await signIn(page);

    await page.locator("span").getByText("Table 2", { exact: true }).click();
    await expect(page.getByText(/Session #\d+ -/)).toBeVisible();

    const replyText = `Your request is being handled! (${testInfo.project.name}-${testInfo.retry})`;
    const replyInput = page.getByPlaceholder("Reply to the guest...");
    await replyInput.fill(replyText);
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText(replyText, { exact: true })).toBeVisible();

    const readyStep = page.getByRole("button", { name: /3 Ready/ });
    if (await readyStep.isVisible()) await readyStep.click();

    const inProgressButton = page.getByRole("button", { name: "In progress" }).first();
    if (await inProgressButton.isVisible()) {
      await inProgressButton.click();
      await expect(inProgressButton).toBeEnabled();
    }
  });

  test("should handle empty message submission gracefully", async ({ page }) => {
    await signIn(page);
    await page.locator("span").getByText("Table 2", { exact: true }).click();
    await expect(page.getByText(/Session #\d+ -/)).toBeVisible();

    const replyInput = page.getByPlaceholder("Reply to the guest...");
    await replyInput.fill("");
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(replyInput).toBeVisible();
    await expect(replyInput).toHaveValue("");
  });

  test("should sign out successfully", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/.*signin|.*login/);
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("should navigate to sessions page and display active sessions data", async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Sessions" }).click();

    await expect(page).toHaveURL(/.*sessions/);
    await expect(page.getByRole("heading", { name: "Customer sessions" })).toBeVisible();
    await expect(page.getByText("Open", { exact: true })).toBeVisible();
    await expect(page.getByText("Needs staff", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("main").getByText("Requests", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Table \d+/ }).first()).toBeVisible();
  });

  test("should navigate to requests page and update a request", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Requests" }).click();

    await expect(page.getByRole("heading", { name: "Request queue" })).toBeVisible();
    await expect(page.getByText(/\d+ pending/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Table \d+/ }).first()).toBeVisible();

    const inProgressButton = page.getByRole("button", { name: "In progress" }).first();
    await inProgressButton.click();
    await expect(inProgressButton).toBeEnabled();
  });
});
