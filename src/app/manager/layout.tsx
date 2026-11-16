import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { AppHeader } from "@/components/AppHeader";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext(["manager"]);
  const { labels } = ctx.template.config;

  const navItems = [
    { href: "/manager", label: "Dashboard" },
    { href: "/manager/customers", label: labels.customers },
    { href: "/manager/enquiries", label: labels.enquiries },
    { href: "/manager/jobs", label: labels.jobs },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader ctx={ctx} roleLabel={labels.manager} />
      <nav className="flex gap-1 border-b border-slate-200 bg-white px-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
