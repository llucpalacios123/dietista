import { test, expect } from "@playwright/test";
import { generateEmail, generatePassword } from "./helpers/test-data";
import { registerUser, loginUser } from "./helpers/api";

test.describe("Dashboard navigation", () => {
  test("shows welcome message with user email", async ({ page, request }) => {
    const email = generateEmail("dash-welcome");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("navigation links are present and functional", async ({ page, request }) => {
    const email = generateEmail("dash-nav");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");

    // Dashboard link
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    // Profile link - use header nav context
    await page.locator("header nav").getByRole("link", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 10000 });

    // Meal Plans link
    await page.locator("header nav").getByRole("link", { name: "Meal Plans" }).click();
    await expect(page).toHaveURL(/\/meal-plans/, { timeout: 10000 });

    // Meal Logs link
    await page.locator("header nav").getByRole("link", { name: "Meal Logs" }).click();
    await expect(page).toHaveURL(/\/meal-logs/, { timeout: 10000 });
  });

  test("active page link is distinguishable", async ({ page, request }) => {
    const email = generateEmail("dash-active");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    // Navigate to profile
    await page.goto("/profile");

    // Profile link should have different styling (text-primary class)
    const profileLink = page.getByRole("link", { name: "Profile" });
    const classes = await profileLink.getAttribute("class");
    expect(classes).toContain("text-primary");
  });

  test("logout button redirects to login", async ({ page, request }) => {
    const email = generateEmail("dash-logout");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");
    await page.getByRole("button", { name: /logout/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows profile setup prompt when no profile exists", async ({ page, request }) => {
    const email = generateEmail("dash-profile-prompt");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");

    await expect(page.getByText(/complete your profile/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /set up profile/i })).toBeVisible();
  });

  test("shows no active plan prompt when no plan exists", async ({ page, request }) => {
    const email = generateEmail("dash-no-plan");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");

    await expect(page.getByText(/no active meal plan/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /generate meal plan/i })).toBeVisible({ timeout: 10000 });
  });

  test("logo links to dashboard", async ({ page, request }) => {
    const email = generateEmail("dash-logo");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/profile");
    await page.getByRole("link", { name: "Dietista" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("navigation persists across page reloads", async ({ page, request }) => {
    const email = generateEmail("dash-reload");
    const password = generatePassword();
    await registerUser(request, email, password);
    const cookies = await loginUser(request, email, password);
    await page.context().addCookies(cookies);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    await page.reload();

    // Should still be on dashboard after reload
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible({ timeout: 10000 });
  });
});
