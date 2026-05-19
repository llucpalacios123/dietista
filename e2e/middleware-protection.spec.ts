import { test, expect } from "@playwright/test";
import { generateEmail, generatePassword } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

test.describe("Middleware protection", () => {
  test.describe("unauthenticated users", () => {
    test("dashboard redirects to login with callbackUrl", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
      await expect(page).toHaveURL(/callbackUrl=%2Fdashboard/);
    });

    test("profile redirects to login with callbackUrl", async ({ page }) => {
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/login/);
      await expect(page).toHaveURL(/callbackUrl=%2Fprofile/);
    });

    test("meal-plans redirects to login with callbackUrl", async ({ page }) => {
      await page.goto("/meal-plans");
      await expect(page).toHaveURL(/\/login/);
      await expect(page).toHaveURL(/callbackUrl=%2Fmeal-plans/);
    });

    test("meal-logs redirects to login with callbackUrl", async ({ page }) => {
      await page.goto("/meal-logs");
      await expect(page).toHaveURL(/\/login/);
      await expect(page).toHaveURL(/callbackUrl=%2Fmeal-logs/);
    });
  });

  test.describe("authenticated users", () => {
    test("login redirects authenticated users to dashboard", async ({ page, request }) => {
      const email = generateEmail("mw-login");
      const password = generatePassword();
      await registerUser(request, email, password);
      const cookies = await loginUser(request, email, password);
      await page.context().addCookies(cookies);

      await page.goto("/login");
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("register redirects authenticated users to dashboard", async ({ page, request }) => {
      const email = generateEmail("mw-reg");
      const password = generatePassword();
      await registerUser(request, email, password);
      const cookies = await loginUser(request, email, password);
      await page.context().addCookies(cookies);

      await page.goto("/register");
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("protected routes accessible after login", async ({ page, request }) => {
      const email = generateEmail("mw-routes");
      const password = generatePassword();
      await registerUser(request, email, password);
      const cookies = await loginUser(request, email, password);
      await page.context().addCookies(cookies);

      // Dashboard
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/dashboard/);

      // Profile
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile/);

      // Meal plans
      await page.goto("/meal-plans");
      await expect(page).toHaveURL(/\/meal-plans/);

      // Meal logs
      await page.goto("/meal-logs");
      await expect(page).toHaveURL(/\/meal-logs/);
    });

    test("callbackUrl redirects after login", async ({ page, request }) => {
      const email = generateEmail("mw-callback");
      const password = generatePassword();
      await registerUser(request, email, password);

      await page.goto("/login");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should redirect to dashboard (default when no callbackUrl)
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });
  });
});
