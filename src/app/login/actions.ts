"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Could not sign in: " + error.message)}`);
  }
  redirect("/");
}

export async function signInAsDemoRole(role: "manager" | "worker" | "customer") {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: DEMO_ACCOUNTS[role],
    password: DEMO_PASSWORD,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Demo login failed: " + error.message + ". Have you run the seed script yet?"
      )}`
    );
  }
  redirect("/");
}

export async function signInAsDemoManager() {
  await signInAsDemoRole("manager");
}

export async function signInAsDemoWorker() {
  await signInAsDemoRole("worker");
}

export async function signInAsDemoCustomer() {
  await signInAsDemoRole("customer");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
