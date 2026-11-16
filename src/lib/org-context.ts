import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { TemplateConfig } from "./templates/types";

export type Role = "manager" | "worker" | "customer";

export type OrgContext = {
  userId: string;
  profile: {
    id: string;
    role: Role;
    displayName: string;
    orgId: string;
    customerId: string | null;
  };
  organisation: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  template: {
    key: string;
    name: string;
    config: TemplateConfig;
  };
};

export function roleHome(role: Role): string {
  if (role === "manager") return "/manager";
  if (role === "worker") return "/worker";
  return "/portal";
}

// Loads everything a page needs to know about who's signed in and how their
// organisation's active template wants things labelled. Redirects to /login
// if not signed in, or to the user's own home if their role isn't allowed here.
export async function requireOrgContext(allowedRoles?: Role[]): Promise<OrgContext> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, org_id, customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const role = profile.role as Role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect(roleHome(role));
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id, name, logo_url, primary_color, secondary_color, active_template_id")
    .eq("id", profile.org_id)
    .single();

  if (!organisation) redirect("/login");

  const { data: template } = await supabase
    .from("industry_templates")
    .select("key, name, config")
    .eq("id", organisation.active_template_id)
    .single();

  if (!template) redirect("/login");

  return {
    userId: user.id,
    profile: {
      id: profile.id,
      role,
      displayName: profile.display_name,
      orgId: profile.org_id,
      customerId: profile.customer_id,
    },
    organisation: {
      id: organisation.id,
      name: organisation.name,
      logoUrl: organisation.logo_url,
      primaryColor: organisation.primary_color,
      secondaryColor: organisation.secondary_color,
    },
    template: {
      key: template.key,
      name: template.name,
      config: template.config as TemplateConfig,
    },
  };
}
