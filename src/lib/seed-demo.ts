import { createAdminClient } from "./supabase/admin";
import { allTemplates, getTemplateByKey } from "./templates";
import { DEMO_PASSWORD, DEMO_ACCOUNTS } from "./demo-accounts";

// Wipes the demo and rebuilds it around ONE active template. Used by the
// one-off `npm run seed` script AND by the admin "switch template" screen
// (Phase 7) so both paths share exactly the same logic.
export async function seedDemoOrganisation(templateKey: string) {
  const template = getTemplateByKey(templateKey);
  if (!template) {
    throw new Error(
      `Unknown template key "${templateKey}". Available: ${allTemplates.map((t) => t.key).join(", ")}`
    );
  }

  const supabase = createAdminClient();
  const log: string[] = [];

  log.push("Clearing existing demo accounts...");
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const demoEmails: string[] = Object.values(DEMO_ACCOUNTS);
  for (const u of userList.users) {
    if (u.email && demoEmails.includes(u.email)) {
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  log.push("Clearing existing organisation data...");
  await supabase.from("organisations").delete().not("id", "is", null);

  log.push("Reloading the industry template library...");
  await supabase.from("industry_templates").delete().not("id", "is", null);
  const templateIdByKey: Record<string, string> = {};
  for (const t of allTemplates) {
    const { data, error } = await supabase
      .from("industry_templates")
      .insert({ key: t.key, name: t.name, config: t.config })
      .select("id")
      .single();
    if (error) throw error;
    templateIdByKey[t.key] = data.id;
  }

  log.push(`Creating demo organisation "${template.config.demoData.orgName}" (${template.name} template)...`);
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({
      name: template.config.demoData.orgName,
      primary_color: template.config.branding.primaryColor,
      secondary_color: template.config.branding.secondaryColor,
      active_template_id: templateIdByKey[template.key],
    })
    .select("id")
    .single();
  if (orgError) throw orgError;

  log.push("Creating manager & worker logins...");
  const managerDemo = template.config.demoData.staff.find((s) => s.role === "manager");
  const workerDemo = template.config.demoData.staff.find((s) => s.role === "worker");
  const staffToCreate: Array<{ role: "manager" | "worker"; email: string; displayName: string }> = [
    { role: "manager", email: DEMO_ACCOUNTS.manager, displayName: managerDemo?.displayName ?? "Demo Manager" },
    { role: "worker", email: DEMO_ACCOUNTS.worker, displayName: workerDemo?.displayName ?? "Demo Worker" },
  ];
  for (const s of staffToCreate) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: s.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (authError) throw authError;
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: authUser.user.id, org_id: org.id, role: s.role, display_name: s.displayName });
    if (profileError) throw profileError;
  }

  log.push("Creating demo customers...");
  const customerIds: string[] = [];
  for (const c of template.config.demoData.customers) {
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({ org_id: org.id, name: c.name, email: c.email, phone: c.phone })
      .select("id")
      .single();
    if (error) throw error;
    customerIds.push(customer.id);
  }

  log.push("Creating customer portal login...");
  const { data: customerAuthUser, error: customerAuthError } = await supabase.auth.admin.createUser({
    email: DEMO_ACCOUNTS.customer,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (customerAuthError) throw customerAuthError;
  const { error: customerProfileError } = await supabase.from("profiles").insert({
    id: customerAuthUser.user.id,
    org_id: org.id,
    role: "customer",
    display_name: template.config.demoData.customers[0]?.name ?? "Demo Customer",
    customer_id: customerIds[0],
  });
  if (customerProfileError) throw customerProfileError;

  log.push(`Done. Organisation "${template.config.demoData.orgName}" is ready on the ${template.name} template.`);
  return { log, orgId: org.id as string, templateKey: template.key };
}
