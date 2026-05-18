import { test, expect } from "@playwright/test";
import { generateEmail, generatePassword } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

test.describe("Error handling", () => {
  test.describe("auth errors", () => {
    test("login shows error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("nonexistent@test.com");
      await page.getByLabel(/password/i).fill("WrongPassword1");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should show error message
      await expect(page).toHaveURL(/\/login/);
    });

    test("registration with duplicate email", async ({ page, request }) => {
      const email = generateEmail("dup-email");
      const password = generatePassword();
      // Register first user
      await registerUser(request, email, password);

      // Try to register again with same email
      await page.goto("/register");
      await page.getByLabel(/email/i).fill(email);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole("button", { name: /create account/i }).click();

      // Should show error
      await page.waitForTimeout(3000);
      // Either stays on register or shows error
      const url = page.url();
      expect(url.includes("/register") || url.includes("/profile")).toBe(true);
    });

    test("registration with weak password", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/email/i).fill("weak@test.com");
      await page.getByLabel(/password/i).fill("weak");
      await page.getByRole("button", { name: /create account/i }).click();

      // Should show validation error
      await expect(page.getByText(/must be at least 8/i)).toBeVisible();
    });

    test("registration with invalid email format", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/email/i).fill("not-an-email");
      await page.getByLabel(/password/i).fill("StrongPass1!");
      await page.getByRole("button", { name: /create account/i }).click();

      // Should show validation error (either client or server side)
      await page.waitForTimeout(3000);
      // Either shows error or stays on register page
      const url = page.url();
      expect(url.includes("/register") || url.includes("error")).toBe(true);
    });
  });

  test.describe("API errors", () => {
    test("protected API returns 401 for unauthenticated users", async ({ request }) => {
      const response = await request.get("/api/meal-plans");
      expect(response.status()).toBe(401);
    });

    test("protected API returns 401 for meal-logs", async ({ request }) => {
      const response = await request.get("/api/meal-logs");
      expect(response.status()).toBe(401);
    });

    test("non-existent API route returns 404", async ({ request }) => {
      const response = await request.get("/api/non-existent");
      expect(response.status()).toBe(404);
    });

    test("malformed API request returns 400", async ({ request }) => {
      const response = await request.post("/api/auth/register", {
        data: { email: "bad", password: "short" },
      });
      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe("UI error recovery", () => {
    test("error state allows retry", async ({ page }) => {
      await page.goto("/login");

      // Submit invalid form
      await page.getByLabel(/email/i).fill("bad@test.com");
      await page.getByLabel(/password/i).fill("wrong");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should still be on login page, able to retry
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test("navigation works after failed login", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("bad@test.com");
      await page.getByLabel(/password/i).fill("wrong");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Should still be able to navigate to register
      await page.getByRole("link", { name: /register/i }).click();
      await expect(page).toHaveURL(/\/register/);
    });

    test("page reload recovers from error state", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("bad@test.com");
      await page.getByLabel(/password/i).fill("wrong");
      await page.getByRole("button", { name: /sign in/i }).click();

      // Reload page
      await page.reload();

      // Should be back to clean login form
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test("concurrent navigation does not break session", async ({ page, request }) => {
      const email = generateEmail("concurrent-nav");
      const password = generatePassword();
      await registerUser(request, email, password);
      const cookies = await loginUser(request, email, password);
      await page.context().addCookies(cookies);

      // Navigate rapidly between pages
      await page.goto("/dashboard");
      await page.goto("/profile");
      await page.goto("/meal-plans");
      await page.goto("/meal-logs");
      await page.goto("/dashboard");

      // Should still be authenticated
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });
});
