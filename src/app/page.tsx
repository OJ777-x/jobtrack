import { redirect } from "next/navigation";
import { requireOrgContext, roleHome } from "@/lib/org-context";

export default async function RootPage() {
  const ctx = await requireOrgContext();
  redirect(roleHome(ctx.profile.role));
}
