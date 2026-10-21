import { requireStaffPage } from "@/lib/admin/guard";
import { listStaff } from "@/lib/aws/cognito";
import { ROLE_LABELS, PERMISSIONS, type Role } from "@/lib/auth/roles";
import { Notice, PageHeader, Panel, Pill, Table } from "@/components/admin/ui";
import { InviteStaff, StaffRowActions } from "./StaffClient";

export const metadata = { title: "Staff" };

const DESCRIPTIONS: Record<Role, string> = {
  owner: "Everything, including refunds, prices, exports, erasing customer data and managing staff.",
  staff: "Ship orders, add tracking, manage stock, subscriptions, reviews and the banner. Sees customer details.",
  viewer: "Read-only. Customer names and emails are masked.",
};

export default async function StaffPage() {
  const me = await requireStaffPage("staff:manage");
  let staff: Awaited<ReturnType<typeof listStaff>> = [];
  let error = false;
  try {
    staff = await listStaff();
  } catch (err) {
    console.error("[admin] staff list failed", (err as Error).name);
    error = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        intro="Staff logins live in their own user pool, separate from customer accounts. Everyone signs in with a password and an authenticator app."
      />
      {error ? <Notice tone="bad">Staff couldn't be loaded. Check the staff user pool settings.</Notice> : null}
      <InviteStaff />
      <Table head={["Name", "Email", "Role", "Status", ""]} minWidth={720}>
        {staff.map((s) => (
          <tr key={s.username}>
            <td className="px-4 py-3">{s.name}</td>
            <td className="px-4 py-3">{s.email}</td>
            <td className="px-4 py-3">{s.role ? ROLE_LABELS[s.role] : <Pill tone="warn">No role</Pill>}</td>
            <td className="px-4 py-3">
              {!s.enabled ? <Pill tone="bad">Disabled</Pill> : s.status === "FORCE_CHANGE_PASSWORD" ? <Pill tone="warn">Invite pending</Pill> : <Pill tone="good">Active</Pill>}
            </td>
            <td className="px-4 py-3 text-right">
              {s.username === me.user.username ? <span className="text-xs text-ink/55">You</span> : <StaffRowActions username={s.username} role={s.role} enabled={s.enabled} />}
            </td>
          </tr>
        ))}
      </Table>
      <Panel title="What each role can do">
        <ul className="text-sm space-y-2">
          {(["owner", "staff", "viewer"] as Role[]).map((r) => (
            <li key={r}>
              <span className="font-medium">{ROLE_LABELS[r]}:</span> {DESCRIPTIONS[r]}
              <span className="block text-xs text-ink/55">
                {Object.entries(PERMISSIONS)
                  .filter(([, roles]) => (roles as readonly Role[]).includes(r))
                  .map(([p]) => p)
                  .join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
