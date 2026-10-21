import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { listAudit } from "@/lib/data/audit";
import { Empty, Notice, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Activity log" };

export default async function ActivityPage({ searchParams }: { searchParams: { month?: string; cursor?: string } }) {
  await requireStaffPage("audit:read");
  const month = /^\d{4}-\d{2}$/.test(searchParams.month ?? "") ? searchParams.month! : new Date().toISOString().slice(0, 7);
  let entries: Awaited<ReturnType<typeof listAudit>>["entries"] = [];
  let cursor: string | undefined;
  let error = false;
  try {
    const page = await listAudit(month, searchParams.cursor, 100);
    entries = page.entries;
    cursor = page.cursor;
  } catch (err) {
    console.error("[admin] audit failed", (err as Error).name);
    error = true;
  }
  const [y, m] = month.split("-").map(Number) as [number, number];
  const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" intro="Every staff action and every view or export of customer data. Kept for two years." />
      <nav className="flex items-center gap-3 text-sm">
        <Link className="underline" href={`/admin/activity?month=${prev}`}>← {prev}</Link>
        <span className="font-medium">{month}</span>
        {next <= new Date().toISOString().slice(0, 7) ? <Link className="underline" href={`/admin/activity?month=${next}`}>{next} →</Link> : null}
      </nav>
      {error ? <Notice tone="bad">The activity log couldn't be loaded.</Notice> : null}
      {entries.length === 0 ? (
        <Empty>No activity this month.</Empty>
      ) : (
        <Table head={["When (UTC)", "Who", "Action", "Target", "Details", "IP"]} minWidth={880}>
          {entries.map((e) => (
            <tr key={e.sk}>
              <td className="px-4 py-2 whitespace-nowrap">{e.at.replace("T", " ").slice(0, 19)}</td>
              <td className="px-4 py-2">{e.actorEmail}<span className="block text-xs text-ink/55">{e.actorRole}</span></td>
              <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
              <td className="px-4 py-2 font-mono text-xs">{e.target}</td>
              <td className="px-4 py-2 text-xs">{e.detail ? Object.entries(e.detail).map(([k, v]) => `${k}: ${v}`).join(", ") : ""}</td>
              <td className="px-4 py-2 text-xs">{e.ip}</td>
            </tr>
          ))}
        </Table>
      )}
      {cursor ? <Link className="btn-secondary text-sm" href={`/admin/activity?month=${month}&cursor=${encodeURIComponent(cursor)}`}>Older</Link> : null}
    </div>
  );
}
