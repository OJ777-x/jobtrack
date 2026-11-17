import { createHash } from "node:crypto";
import { cookies } from "next/headers";

// A separate, simple password gate for the demo-control admin area — not
// tied to any organisation's Supabase login, because switching templates
// destroys and recreates the organisation itself.
const COOKIE_NAME = "jobtrack_admin_session";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "jobtrack-admin";
}

function expectedCookieValue(): string {
  return createHash("sha256").update(adminPassword()).digest("hex");
}

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value === expectedCookieValue();
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, expectedCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours — a sales demo session, not a long-lived login
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function checkAdminPassword(submitted: string): boolean {
  return submitted === adminPassword();
}
