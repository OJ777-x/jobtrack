"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, setAdminSession, clearAdminSession, isAdminAuthed } from "@/lib/admin-auth";
import { seedDemoOrganisation } from "@/lib/seed-demo";

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!checkAdminPassword(password)) {
    redirect(`/admin/login?error=${encodeURIComponent("Incorrect password")}`);
  }
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function switchTemplate(templateKey: string) {
  if (!(await isAdminAuthed())) redirect("/admin/login");
  await seedDemoOrganisation(templateKey);
  redirect("/admin?switched=1");
}
