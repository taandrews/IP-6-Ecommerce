import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · IP6 Original" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaffPage();
  return (
    <AdminShell role={staff.role} name={staff.user.name} email={staff.user.email}>
      {children}
    </AdminShell>
  );
}
