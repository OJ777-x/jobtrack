import { cache } from "react";
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

type ProfileRow = {
  id: string;
  role: string;
  display_name: string;
  org_id: string;
  customer_id: string | null;
  organisations: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    industry_templates: {
      key: string;
      name: string;
      config: TemplateConfig;
    } | null;
  } | null;
};

// React's cache() de-duplicates this within a single request — the layout
// and the page it wraps both need this, and without caching that meant the
// whole auth/profile/org/template chain ran twice per navigation. Takes no
// arguments on purpose (role checks happen in requireOrgContext below)
// because cache() keys on argument identity, and two call sites each
// writing `["manager"]` create different array instances that wouldn't
// dedupe against each other.
const loadOrgContext = cache(async (): Promise<OrgContext | null> => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  // One round trip instead of three sequential ones: profile -> org -> template
  // chained via Postgres foreign keys and fetched as nested resources.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `id, role, display_name, org_id, customer_id,
       organisations (
         id, name, logo_url, primary_color, secondary_color,
         industry_templates ( key, name, config )
       )`
    )
    .eq("id", user.id)
    .single<ProfileRow>();

  const organisation = profile?.organisations;
  const template = organisation?.industry_templates;
  if (!profile || !organisation || !template) return null;

  return {
    userId: user.id,
    profile: {
      id: profile.id,
      role: profile.role as Role,
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
      config: template.config,
    },
  };
});

// Loads everything a page needs to know about who's signed in and how their
// organisation's active template wants things labelled. Redirects to /login
// if not signed in, or to the user's own home if their role isn't allowed here.
export async function requireOrgContext(allowedRoles?: Role[]): Promise<OrgContext> {
  const ctx = await loadOrgContext();
  if (!ctx) redirect("/login");

  if (allowedRoles && !allowedRoles.includes(ctx.profile.role)) {
    redirect(roleHome(ctx.profile.role));
  }

  return ctx;
}
