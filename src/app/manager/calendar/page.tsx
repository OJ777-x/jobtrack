import Link from "next/link";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { jobTypeLabel } from "@/lib/job-helpers";

function monthBounds(monthParam?: string) {
  const now = new Date();
  const [yearStr, monthStr] = (monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { year, month, firstOfMonth, daysInMonth };
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const ctx = await requireOrgContext(["manager"]);
  const { labels, config } = { labels: ctx.template.config.labels, config: ctx.template.config };
  const { month: monthParam } = await searchParams;
  const { year, month, firstOfMonth, daysInMonth } = monthBounds(monthParam);

  const rangeStart = toDateKey(firstOfMonth);
  const rangeEnd = toDateKey(new Date(Date.UTC(year, month - 1, daysInMonth)));

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, reference_number, job_type, due_date, customers(name), profiles(display_name)")
    .eq("org_id", ctx.organisation.id)
    .gte("due_date", rangeStart)
    .lte("due_date", rangeEnd);

  const jobsByDay = new Map<string, typeof jobs>();
  for (const j of jobs ?? []) {
    if (!j.due_date) continue;
    const list = jobsByDay.get(j.due_date) ?? [];
    list.push(j);
    jobsByDay.set(j.due_date, list);
  }

  // Monday-first grid, including leading/trailing days from adjacent months.
  const startWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // 0 = Monday
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(Date.UTC(year, month - 1, 1 - startWeekday + i));
    cells.push({ date, inMonth: date.getUTCMonth() === month - 1 });
  }

  const prevMonth = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthName = firstOfMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const todayKey = toDateKey(new Date());

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Schedule</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/manager/calendar?month=${prevMonth}`} className="text-blue-700 hover:underline">
            ← Prev
          </Link>
          <span className="font-medium text-slate-700">{monthName}</span>
          <Link href={`/manager/calendar?month=${nextMonth}`} className="text-blue-700 hover:underline">
            Next →
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Shows every {labels.job.toLowerCase()} by its due date — who&apos;s doing what, when.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 bg-slate-50 text-center text-xs font-medium uppercase text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map(({ date, inMonth }) => {
            const key = toDateKey(date);
            const dayJobs = jobsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-[100px] border-b border-r border-slate-100 p-2 ${
                  inMonth ? "bg-white" : "bg-slate-50"
                }`}
              >
                <p className={`text-xs ${key === todayKey ? "font-bold text-blue-700" : inMonth ? "text-slate-500" : "text-slate-300"}`}>
                  {date.getUTCDate()}
                </p>
                <div className="mt-1 space-y-1">
                  {dayJobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/manager/jobs/${j.id}`}
                      className="block truncate rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-800 hover:bg-blue-100"
                      title={`${j.reference_number} · ${jobTypeLabel(config, j.job_type)} · ${(j.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unassigned"}`}
                    >
                      {j.reference_number} · {(j.profiles as unknown as { display_name: string } | null)?.display_name ?? "Unassigned"}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
