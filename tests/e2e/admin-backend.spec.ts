import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { prisma } from "@/lib/prisma";

async function signInAsAdmin(page: Page) {
  await page.goto("/staff-signin");
  await page.getByLabel("Email").fill("staff@testpizza.local");
  await page.getByLabel("Password").fill("staff1234");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe.serial("database-backed administrator workspace", () => {
  test.setTimeout(120_000);
  test("protects admin routes and renders live tenant data", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/staff-signin/);

    await signInAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /Good afternoon/ })).toBeVisible();
    await expect(page.getByText("TestPizza", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/v\d+/, { exact: true }).first()).toBeVisible();
  });

  test("publishes and rolls back an instruction version through every gate", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/instructions");
    await page.getByRole("button", { name: /Create new draft/i }).click();
    await expect(page.getByRole("heading", { name: "Instruction editor" })).toBeVisible();

    await page.getByRole("textbox", { name: "" }).nth(2).fill(
      "E2E: strengthen structured menu grounding and mandatory safety handover.",
    );
    await page.getByRole("button", { name: "Save draft" }).last().click();
    await expect(page.getByText("Draft saved.")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "Continue to validation" }).click();

    await page.getByRole("button", { name: /Run validation/i }).click();
    await expect(page.getByText("All blocking checks passed")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "Open test playground" }).click();

    await page.getByRole("button", { name: /Run policy checks/i }).click();
    await expect(page.getByText("Not run")).toHaveCount(0, { timeout: 30_000 });
    await page.getByRole("link", { name: "Continue to review" }).click();

    await page.getByRole("button", { name: /Approve version/i }).click();
    await expect(page.getByRole("heading", { name: "Publish control" })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /Publish version/i }).click();
    await expect(page).toHaveURL(/admin\/instructions\?published=1/, { timeout: 30_000 });
    await expect(page.getByText("PUBLISHED", { exact: true }).first()).toBeVisible();

    await page.goto("/admin/monitoring");
    const rollback = page.getByRole("button", { name: /Roll back to v/i });
    await expect(rollback).toBeVisible();
    const target = await rollback.textContent();
    await rollback.click();
    await expect(page.getByText(new RegExp(`Current: ${target?.match(/v\d+/)?.[0] ?? "v1"}`))).toBeVisible({ timeout: 30_000 });
  });

  test("persists menu availability and publishes an uploaded knowledge document", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/admin/menu");
    const availability = page.getByRole("switch").first();
    const initial = await availability.getAttribute("aria-checked");
    await availability.click();
    await expect(availability).toBeDisabled();
    await expect(availability).toHaveAttribute("aria-checked", initial === "true" ? "false" : "true", { timeout: 30_000 });
    await expect(availability).toBeEnabled({ timeout: 30_000 });
    await page.reload();
    await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", initial === "true" ? "false" : "true");
    const restoredAvailability = page.getByRole("switch").first();
    await restoredAvailability.click();
    await expect(restoredAvailability).toBeDisabled();
    await expect(restoredAvailability).toHaveAttribute("aria-checked", initial ?? "true", { timeout: 30_000 });
    await expect(restoredAvailability).toBeEnabled({ timeout: 30_000 });

    await page.goto("/admin/knowledge");
    await page.locator('input[type="file"]').setInputFiles(
      path.resolve("tests/fixtures/admin-e2e-policy.md"),
    );
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByRole("heading", { name: "admin-e2e-policy.md" }).first()).toBeVisible({ timeout: 30_000 });
    const uploadedDocument = await prisma.knowledgeDocument.findFirst({
      where: { originalFilename: "admin-e2e-policy.md" },
      orderBy: { id: "desc" },
    });
    expect(uploadedDocument).not.toBeNull();
    const uploadAudit = await prisma.auditLog.findFirst({
      where: {
        restaurantId: uploadedDocument?.restaurantId,
        action: "KNOWLEDGE_DOCUMENT_UPLOADED",
      },
      orderBy: { id: "desc" },
    });
    expect(uploadAudit).not.toBeNull();
    expect(uploadAudit?.metadata).toMatchObject({
      documentId: uploadedDocument?.id,
      originalFilename: "admin-e2e-policy.md",
    });
    await page.getByRole("button", { name: "Validate" }).first().click();
    await expect(page.getByRole("button", { name: "Approve" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).first().click();
    await expect(page.getByRole("button", { name: "Publish" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).first().click();
    await expect(page.getByText("PUBLISHED", { exact: true }).first()).toBeVisible();
  });
});
