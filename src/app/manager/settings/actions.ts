"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";

export async function updateOrgSettings(formData: FormData) {
  const ctx = await requireOrgContext(["manager"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const primaryColor = String(formData.get("primary_color") || "").trim();
  const secondaryColor = String(formData.get("secondary_color") || "").trim();

  const patch: Record<string, string> = {};
  if (name) patch.name = name;
  if (primaryColor) patch.primary_color = primaryColor;
  if (secondaryColor) patch.secondary_color = secondaryColor;

  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${ctx.organisation.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("org-logos").upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("org-logos").getPublicUrl(path);
      patch.logo_url = urlData.publicUrl;
    }
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("organisations").update(patch).eq("id", ctx.organisation.id);
  }

  revalidatePath("/manager/settings");
  revalidatePath("/manager");
}
