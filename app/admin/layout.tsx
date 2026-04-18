import Link from "next/link";
import {
  ShoppingCart,
  Boxes,
  Users,
  Tag,
  BarChart3,
  Newspaper,
  ShieldAlert,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/blog", label: "Blog editor", icon: Newspaper },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-100 grid md:grid-cols-[240px_1fr]">
      <aside className="bg-forest-800 text-ivory-100 md:min-h-screen">
        <div className="p-5 border-b border-forest-600 flex items-center gap-2">
          <ShieldAlert className="size-5 text-gold-300" />
          <span className="font-display text-lg">Admin</span>
        </div>
        <nav className="p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ivory-100/85 hover:bg-forest-700 whitespace-nowrap"
            >
              <l.icon className="size-4 text-gold-300" />
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="p-6 lg:p-10">{children}</section>
    </div>
  );
}
