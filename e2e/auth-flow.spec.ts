import { test, expect } from "./fixtures";
import { generateEmail, generatePassword } from "./helpers/test-data";

/**
 * Auth Flow E2E Tests — 8 scenarios covering registration, login,
 * logout, session persistence, validation errors, and post-auth redirects.
 */

test.describe("Auth Flow", () => {
  // ── Scenario 1: User Registration ─────────────────────────────────────
  test("registers a new user and redirects to profile setup", async ({
    page,
  }) => {
    const email = generateEmail("register");
    const password = generatePassword();

    await page.goto("/register");
    await expect(page).toHaveTitle(/register/i);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    // RegisterForm auto-signs-in and redirects to /profile
    await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
  });

  // ── Scenario 2: Registration with Existing Email ──────────────────────
  test("shows error when registering with an existing email", async ({
    page,
    testUser,
    request,
  }) => {
    // Pre-create the user via API
    await request.post("/api/auth/register", {
      data: { email: testUser.email, password: testUser.password },
    });

    await page.goto("/register");
    await page.getByLabel(/email/i).fill(testUser.email);
    await page.getByLabel(/password/i).fill(testUser.password);
    await page.getByRole("button", { name: /create account/i }).click();

    // Should see the "already registered" error
    await expect(page.getByText(/already registered/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/\/register/);
  });

  // ── Scenario 3: Registration Validation Errors ────────────────────────
  test("shows validation errors for empty fields on register", async ({
    page,
  }) => {
    await page.goto("/register");

    // Submit empty form
    await page.getByRole("button", { name: /create account/i }).click();

    // Zod resolver should show field-level errors
    await expect(page.getByText(/invalid email/i)).toBeVisible({
      timeout: 3_000,
    });
    await expect(page).toHaveURL(/\/register/);
  });

  // ── Scenario 4: Successful Login ──────────────────────────────────────
  test("logs in with valid credentials and reaches dashboard", async ({
    page,
    request,
  }) => {
    const email = generateEmail("login");
    const password = generatePassword();

    // Register via API first
    await request.post("/api/auth/register", {
      data: { email, password },
    });

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  // ── Scenario 5: Login with Invalid Credentials ────────────────────────
  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel(/email/i).fill("wrong@test.com");
    await page.getByLabel(/password/i).fill("WrongPassword1");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Scenario 6: Logout ────────────────────────────────────────────────
  test("logs out and clears the session", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Verify we are on dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Click logout button in the nav
    await page.getByRole("button", { name: /logout/i }).click();

    // Should be redirected to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    // Navigating to dashboard should redirect back to login
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  // ── Scenario 7: Session Persistence ───────────────────────────────────
  test("session persists across page refreshes", async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();

    // Refresh the page
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  // ── Scenario 8: Redirect After Login (callbackUrl) ────────────────────
  test("redirects back to protected route after login", async ({
    page,
    request,
  }) => {
    const email = generateEmail("redirect");
    const password = generatePassword();

    // Register via API
    await request.post("/api/auth/register", {
      data: { email, password },
    });

    // Attempt to access protected route without auth
    await page.goto("/meal-plans");
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    // The callbackUrl should be in the URL
    await expect(page).toHaveURL(/callbackUrl=/);

    // Login
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should be redirected back to /meal-plans (or /dashboard since the app uses router.push)
    await expect(page).toHaveURL(/\/meal-plans|\/dashboard/, {
      timeout: 10_000,
    });
  });
});
