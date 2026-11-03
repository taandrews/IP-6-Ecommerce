import Link from "next/link";
import {
  BarChart3,
  ShoppingCart,
  Clock,
  Package,
  Users,
  ShieldCheck,
  Tag,
  RefreshCw,
  MessageSquare,
  Megaphone,
  UserCog,
  History,
  Newspaper,
  LogOut,
  BellRing,
  ExternalLink,
} from "lucide-react";
import { can, ROLE_LABELS, type Permission, type Role } from "@/lib/auth/roles";

const SHOPIFY_ADMIN = `https://admin.shopify.com/store/${(process.env.SHOPIFY_STORE_DOMAIN ?? "ip6-original.myshopify.com").replace(".myshopify.com", "")}`;

const NAV: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }>; perm: Permission; external?: boolean }> = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, perm: "dashboard:read" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, perm: "orders:read" },
  { href: "/admin/preorders", label: "Pre-orders", icon: Clock, perm: "orders:read" },
  { href: "/admin/products", label: "Products and stock", icon: Package, perm: "orders:read" },
  { href: "/admin/customers", label: "Customers", icon: Users, perm: "customers:read" },
  { href: "/admin/waitlist", label: "Launch waitlist", icon: BellRing, perm: "customers:read" },
  { href: "/admin/privacy", label: "Privacy requests", icon: ShieldCheck, perm: "privacy:manage" },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare, perm: "reviews:moderate" },
  { href: "/admin/banner", label: "Site banner", icon: Megaphone, perm: "banner:write" },
  { href: "/admin/blog", label: "Blog editor", icon: Newspaper, perm: "banner:write" },
  { href: "/admin/staff", label: "Staff", icon: UserCog, perm: "staff:manage" },
  { href: "/admin/activity", label: "Activity log", icon: History, perm: "audit:read" },
  { href: `${SHOPIFY_ADMIN}/discounts`, label: "Discounts (Shopify)", icon: Tag, perm: "orders:read", external: true },
  { href: `${SHOPIFY_ADMIN}/apps/subscriptions-remix`, label: "Subscriptions (Shopify)", icon: RefreshCw, perm: "orders:read", external: true },
];

export function AdminShell({ role, name, email, children }: { role: Role; name?: string; email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cloud-100 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="bg-navy-800 text-surface lg:min-h-screen lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-white/10">
          <Link href="/admin" className="font-semibold tracking-wide">IP6 Original Admin</Link>
        </div>
        <nav aria-label="Admin" className="flex lg:flex-col gap-1 overflow-x-auto px-3 py-3">
          {NAV.filter((n) => can(role, n.perm)).map((n) => {
            const cls = "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-surface/85 hover:bg-white/10 whitespace-nowrap";
            const body = (
              <>
                <n.icon className="size-4 text-gold-300 shrink-0" />
                {n.label}
                {n.external ? <ExternalLink className="size-3 text-surface/50" aria-label="opens Shopify" /> : null}
              </>
            );
            return n.external ? (
              <a key={n.href} href={n.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {body}
              </a>
            ) : (
              <Link key={n.href} href={n.href} className={cls}>
                {body}
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:block px-5 py-4 border-t border-white/10 text-xs text-surface/70">
          <p className="font-medium text-surface truncate">{name || email}</p>
          <p className="truncate">{email}</p>
          <p className="mt-1">{ROLE_LABELS[role]}</p>
          <form action="/api/admin/auth/signout" method="post" className="mt-3">
            <button type="submit" className="inline-flex items-center gap-1.5 text-surface/85 hover:text-surface">
              <LogOut className="size-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10 min-w-0">
        <div className="lg:hidden mb-6 flex items-center justify-between text-xs text-ink/70">
          <span>
            {email} · {ROLE_LABELS[role]}
          </span>
          <form action="/api/admin/auth/signout" method="post">
            <button type="submit" className="underline">Sign out</button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
