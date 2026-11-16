"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";

export async function createCustomer(formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name) {
    redirect(`/manager/customers/new?error=${encodeURIComponent("Name is required")}`);
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({ org_id: ctx.organisation.id, name, email, phone, notes })
    .select("id")
    .single();

  if (error) {
    redirect(`/manager/customers/new?error=${encodeURIComponent(error.message)}`);
  }

  const addressLine1 = String(formData.get("address_line1") || "").trim();
  if (addressLine1) {
    await supabase.from("sites").insert({
      org_id: ctx.organisation.id,
      customer_id: customer.id,
      address_line1: addressLine1,
      address_line2: String(formData.get("address_line2") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      postcode: String(formData.get("postcode") || "").trim() || null,
    });
  }

  revalidatePath("/manager/customers");
  redirect(`/manager/customers/${customer.id}`);
}

export async function addContact(customerId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  await supabase.from("contacts").insert({
    org_id: ctx.organisation.id,
    customer_id: customerId,
    name,
    email: String(formData.get("email") || "").trim() || null,
    phone: String(formData.get("phone") || "").trim() || null,
    role_title: String(formData.get("role_title") || "").trim() || null,
  });

  revalidatePath(`/manager/customers/${customerId}`);
}

export async function addSite(customerId: string, formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const addressLine1 = String(formData.get("address_line1") || "").trim();
  if (!addressLine1) return;

  await supabase.from("sites").insert({
    org_id: ctx.organisation.id,
    customer_id: customerId,
    address_line1: addressLine1,
    address_line2: String(formData.get("address_line2") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    postcode: String(formData.get("postcode") || "").trim() || null,
  });

  revalidatePath(`/manager/customers/${customerId}`);
}
