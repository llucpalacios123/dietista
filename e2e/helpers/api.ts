import type { APIRequestContext } from "@playwright/test";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
}

// ─── Cookie Parsing ─────────────────────────────────────────────────────────

/**
 * Parses a raw Set-Cookie header value into a Playwright-compatible cookie
 * object suitable for browserContext.addCookies().
 */
function parseSetCookie(
  setCookie: string
): SessionCookie | null {
  const [nameValue] = setCookie.split(";");
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;
  return {
    name: nameValue.substring(0, eqIdx).trim(),
    value: nameValue.substring(eqIdx + 1).trim(),
    domain: "localhost",
    path: "/",
  };
}

// ─── Auth Helpers ───────────────────────────────────────────────────────────

/**
 * Registers a new user via the application's register API.
 * Throws if the server responds with a non-201 status.
 */
export async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<void> {
  const response = await request.post("/api/auth/register", {
    data: { email, password },
  });

  if (response.status() !== 201) {
    const body = await response.text();
    throw new Error(
      `Registration failed (${response.status()}): ${body}`
    );
  }
}

/**
 * Logs in via NextAuth credentials callback and returns the session cookies
 * that can be injected into a browser context.
 *
 * Flow:
 *  1. GET  /api/auth/csrf              → obtain CSRF token + cookie
 *  2. POST /api/auth/callback/credentials → authenticate (maxRedirects: 0)
 *  3. Extract Set-Cookie headers from the 302 response
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<SessionCookie[]> {
  // Step 1 — fetch CSRF token (APIRequestContext stores the CSRF cookie automatically)
  const csrfRes = await request.get("/api/auth/csrf");
  if (!csrfRes.ok()) {
    throw new Error(`CSRF fetch failed (${csrfRes.status()})`);
  }
  const csrfData = await csrfRes.json();
  const csrfToken: string = csrfData.csrfToken;
  if (!csrfToken) {
    throw new Error("No CSRF token returned from /api/auth/csrf");
  }

  // Step 2 — authenticate (don't follow redirect — we need the Set-Cookie)
  const loginRes = await request.post(
    "/api/auth/callback/credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form: {
        csrfToken,
        email,
        password,
      },
      maxRedirects: 0,
    }
  );

  // NextAuth returns 302 on success, 302 to /login?error=… on failure
  if (loginRes.status() === 302) {
    const location = loginRes.headers()["location"];
    if (location && location.includes("error=")) {
      throw new Error(`Login failed — redirected to: ${location}`);
    }

    const cookies = loginRes
      .headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => parseSetCookie(h.value))
      .filter((c): c is SessionCookie => c !== null);

    if (cookies.length === 0) {
      throw new Error("Login returned 302 but no Set-Cookie headers found");
    }

    return cookies;
  }

  const body = await loginRes.text();
  throw new Error(`Login failed (${loginRes.status()}): ${body}`);
}
