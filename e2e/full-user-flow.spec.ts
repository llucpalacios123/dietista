import { test, expect } from "@playwright/test";

/**
 * E2E test: Full user flow
 * Register → Login → Create Profile → Generate Meal Plan → Verify Plan → Log Meal → Verify History
 *
 * Note: This test requires a running Next.js dev server and PostgreSQL database.
 * The database should be seeded/cleaned before each test run.
 *
 * Prerequisites:
 *   1. PostgreSQL running (docker compose up -d)
 *   2. Database migrated (npx prisma migrate dev)
 *   3. Dev server running (npm run dev)
 *   4. OPENAI_API_KEY set in environment (for meal plan generation)
 */

test.describe("Full user flow", () => {
  const testEmail = `e2e-${Date.now()}@test.com`;
  const testPassword = "E2ePassword1";

  test("complete user journey: register → profile → meal plan → meal log", async ({ page }) => {
    // ─── Step 1: Register ───────────────────────────────────────────────────
    await page.goto("/register");
    await expect(page).toHaveTitle(/register/i);

    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /register/i }).click();

    // Should redirect to login after successful registration
    await expect(page).toHaveURL(/\/login/);

    // ─── Step 2: Login ──────────────────────────────────────────────────────
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/profile/);

    // ─── Step 3: Create Profile ─────────────────────────────────────────────
    // Navigate to profile page if not already there
    await page.goto("/profile");

    await page.getByLabel(/weight/i).fill("70");
    await page.getByLabel(/height/i).fill("175");
    await page.getByLabel(/age/i).fill("30");
    await page.getByLabel(/sex/i).selectOption("male");
    await page.getByLabel(/goal/i).selectOption("lose");
    await page.getByLabel(/activity level/i).selectOption("moderate");

    await page.getByRole("button", { name: /save|create/i }).click();

    // Should redirect to dashboard after profile creation
    await expect(page).toHaveURL(/\/dashboard/);

    // ─── Step 4: Generate Meal Plan ─────────────────────────────────────────
    await page.goto("/meal-plans");

    // Click generate button
    await page.getByRole("button", { name: /generate/i }).click();

    // Wait for generation to complete (async job)
    // The page should show the meal plan or a status indicator
    await expect(page.getByText(/meal plan|draft|active/i)).toBeVisible({ timeout: 30000 });

    // Verify plan is displayed with meals
    await expect(page.getByText(/breakfast|lunch|dinner|snack/i)).toBeVisible();

    // ─── Step 5: Log a Meal ─────────────────────────────────────────────────
    await page.goto("/meal-logs");

    // Fill in the meal log form
    const today = new Date().toISOString().split("T")[0];
    await page.getByLabel(/date/i).fill(today);
    await page.getByLabel(/meal type|meal/i).selectOption("lunch");
    await page.getByLabel(/food|description/i).fill("grilled chicken breast 200g, rice 150g, salad");

    await page.getByRole("button", { name: /log|submit/i }).click();

    // ─── Step 6: Verify Meal in History ─────────────────────────────────────
    // The meal log should appear in the list
    await expect(page.getByText(/chicken|rice|salad/i)).toBeVisible({ timeout: 30000 });

    // Verify the meal type is displayed
    await expect(page.getByText(/lunch/i)).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    // Navigate to dashboard without being logged in
    await page.goto("/dashboard");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("registration validates password complexity", async ({ page }) => {
    await page.goto("/register");

    // Try weak password
    await page.getByLabel(/email/i).fill("weak@test.com");
    await page.getByLabel(/password/i).fill("weak");
    await page.getByRole("button", { name: /register/i }).click();

    // Should show validation error
    await expect(page.getByText(/password|8 character/i)).toBeVisible();
  });

  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("nonexistent@test.com");
    await page.getByLabel(/password/i).fill("WrongPassword1");
    await page.getByRole("button", { name: /sign in|login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error/i)).toBeVisible();
  });
});
