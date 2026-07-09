import { test, expect } from "@playwright/test";

test.describe("Staff Workflow Tests", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard");
    await expect(page).toHaveURL(/.*signin|.*login/);
  });

  test("should login and display staff workspace", async ({ page }) => {
    await page.goto("http://localhost:3001/staff-signin");
    await page.getByLabel("Email").fill("staff@testpizza.local");
    await page.getByLabel("Password").fill("staff1234");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByRole("heading", { name: "Staff workspace" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Reply to the guest...")).toBeVisible();
  });

  test("should interact with active tables, send replies, and update statuses", async ({
    page,
  }) => {
    // Login
    await page.goto("http://localhost:3001/staff-signin");
    await page.getByLabel("Email").fill("staff@testpizza.local");
    await page.getByLabel("Password").fill("staff1234");
    await page.getByRole("button", { name: /sign in/i }).click();

    // switch Table 2
    await page.locator("span").getByText("Table 2", { exact: true }).click();
    await expect(page.getByText("Table 2", { exact: true })).toHaveCount(2);

    // Reply to customer
    const replyInput = page.getByPlaceholder("Reply to the guest...");
    if (await replyInput.isVisible()) {
      await replyInput.fill("Your request is being handled!");
      await page.getByRole("button", { name: "Send reply" }).click();
      await expect(
        page.getByText("Your request is being handled!")
      ).toBeVisible({ timeout: 20000 });
    }

    const readyStep = page.getByText("READY", { exact: true });
    if (await readyStep.isVisible()) {
      await readyStep.click();
    }

    // Request Status
    const resolvedBtn = page.getByText("Waiting", { exact: true });
    if (await resolvedBtn.isVisible()) {
      await resolvedBtn.click();
    }
  });

  test("should handle empty message submission gracefully", async ({
    page,
  }) => {
    await page.goto("http://localhost:3001/staff-signin");
    await page.getByLabel("Email").fill("staff@testpizza.local");
    await page.getByLabel("Password").fill("staff1234");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.locator("span").getByText("Table 2", { exact: true }).click();

    const replyInput = page.getByPlaceholder("Reply to the guest...");
    await replyInput.fill("");
    await page.getByRole("button", { name: "Send reply" }).click();

    await expect(replyInput).toBeVisible();

    test("should navigate to sessions page and display active sessions data", async ({
      page,
    }) => {
      await page.goto("http://localhost:3001/staff-signin");
      await page.getByLabel("Email").fill("staff@testpizza.local");
      await page.getByLabel("Password").fill("staff1234");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(
        page.getByRole("heading", { name: "Staff workspace" })
      ).toBeVisible();

      await page.getByRole("link", { name: "Sessions" }).click();

      await expect(page).toHaveURL(/.*sessions/);
      await expect(
        page.getByRole("heading", { name: "Customer sessions" })
      ).toBeVisible();

      await expect(page.getByText("OPEN", { exact: true })).toBeVisible();
      await expect(
        page.getByText("NEEDS STAFF", { exact: true })
      ).toBeVisible();
      await expect(page.getByText("REQUESTS", { exact: true })).toBeVisible();

      await expect(page.getByText("Table 1").first()).toBeVisible();

      await expect(
        page.getByText("Your request is being handled!")
      ).toBeVisible();
    });
  });

  // Logout
  test("should sign out successfully", async ({ page }) => {
    await page.goto("http://localhost:3001/staff-signin");
    await page.getByLabel("Email").fill("staff@testpizza.local");
    await page.getByLabel("Password").fill("staff1234");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("heading", { name: "Staff workspace" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL(/.*signin|.*login/);

    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("should navigate to sessions page and display active sessions data", async ({
    page,
  }) => {
    await page.goto("http://localhost:3001/staff-signin");
    await page.getByLabel("Email").fill("staff@testpizza.local");
    await page.getByLabel("Password").fill("staff1234");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByRole("heading", { name: "Staff workspace" })
    ).toBeVisible();

    await page.getByRole("link", { name: "Sessions" }).click();

    await expect(page).toHaveURL(/.*sessions/);
    await expect(
      page.getByRole("heading", { name: "Customer sessions" })
    ).toBeVisible();

    await expect(page.getByText("Open", { exact: true })).toBeVisible();
    await expect(page.getByText("Needs staff", { exact: true })).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^Requests$/ })).toBeVisible();

    await expect(page.getByText("Table 1").first()).toBeVisible();

    await expect(
      page.getByText("Your request is being handled!")
    ).toBeVisible();
  });

  test('should navigate to requests page and resolve a request', async ({ page }) => {
    // 1. 登录并进入 Requests 页面
    await page.goto('http://localhost:3001/staff-signin'); 
    await page.getByLabel('Email').fill('staff@testpizza.local'); 
    await page.getByLabel('Password').fill('staff1234');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.getByRole('link', { name: 'Requests' }).click();

    await page.getByRole('link', { name: 'Requests' }).click();
    await expect(page.locator('h1:has-text("Request queue")')).toBeVisible();
    await expect(page.locator(':has-text("pending")').first()).toBeVisible();

    await expect(page.getByText('Table 2')).toBeVisible();
    await expect(page.getByText('Request napkin')).toBeVisible();

    const resolveBtn = page.getByText('Resolved', { exact: true });
    await resolveBtn.click();

    await expect(page.getByText('0 pending')).toBeVisible(); 
  });
});
