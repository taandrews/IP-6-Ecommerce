import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/guard";
import { listPrivacyRequests } from "@/lib/data/privacy";
import { sealEmail } from "@/lib/admin/seal";
import { audit } from "@/lib/data/audit";
import { Empty, Notice, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { PrivacyRequestActions } from "./PrivacyRequestActions";

export const metadata = { title: "Privacy requests" };

const DAY = 86400000;

export default async function PrivacyRequestsPage() {
  const staff = await requireStaffPage("privacy:manage");
  let open: Awaited<ReturnType<typeof listPrivacyRequests>> = [];
  let done: typeof open = [];
  let error = false;
  try {
    [open, done] = await Promise.all([listPrivacyRequests("open"), listPrivacyRequests("completed")]);
  } catch (err) {
    console.error("[admin] privacy list failed", (err as Error).name);
    error = true;
  }
  await audit(staff.actor, "privacy.list", undefined, { open: open.length }, staff.ip);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy requests"
        intro="Verified requests to delete or copy a customer's data. GDPR and US state laws give you 30 days (CCPA: 45) from the request to complete them."
      />
      {error ? <Notice tone="bad">Requests couldn't be loaded. Check the PrivacyRequests table is deployed.</Notice> : null}
      <Panel title={`Open (${open.length})`}>
        {open.length === 0 ? (
          <Empty>No open requests.</Empty>
        ) : (
          <ul className="divide-y divide-cloud-300">
            {open.map((r) => {
              const age = Math.floor((Date.now() - new Date(r.verifiedAt ?? r.createdAt).getTime()) / DAY);
              const k = sealEmail(r.email);
              return (
                <li key={r.requestId} className="py-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {r.type === "delete" ? "Delete data" : "Copy of data"} · {r.email}
                    </p>
                    <p className="text-ink/60">
                      Verified {(r.verifiedAt ?? r.createdAt).slice(0, 10)} · {age} days ago {age >= 25 ? <Pill tone="bad">Due soon</Pill> : null}
                      {r.userId ? " · signed-in request" : " · email-verified request"}
                    </p>
                    {r.details ? <p className="text-ink/75 whitespace-pre-wrap max-w-xl">{r.details}</p> : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link className="btn-secondary text-sm" href={`/admin/customers/view?k=${encodeURIComponent(k)}&request=${r.requestId}`}>
                      {r.type === "delete" ? "Open customer to erase" : "Open customer to export"}
                    </Link>
                    <PrivacyRequestActions requestId={r.requestId} type={r.type} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Panel title="Recently completed">
        {done.length === 0 ? (
          <Empty>None yet.</Empty>
        ) : (
          <ul className="text-sm divide-y divide-cloud-300">
            {done.slice(-25).reverse().map((r) => (
              <li key={r.requestId} className="py-2">
                {r.type} · completed {r.completedAt?.slice(0, 10)} by {r.completedBy} · {r.resolution}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
