import { signOut } from "@/app/login/actions";
import type { OrgContext } from "@/lib/org-context";

export function AppHeader({
  ctx,
  roleLabel,
}: {
  ctx: OrgContext;
  roleLabel: string;
}) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 text-white"
      style={{ backgroundColor: ctx.organisation.primaryColor }}
    >
      <div>
        <p className="text-sm font-semibold leading-tight">{ctx.organisation.name}</p>
        <p className="text-xs leading-tight opacity-80">{ctx.template.name} template</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right text-sm leading-tight">
          <p className="font-medium">{ctx.profile.displayName}</p>
          <p className="text-xs opacity-80">{roleLabel}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-white/40 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
