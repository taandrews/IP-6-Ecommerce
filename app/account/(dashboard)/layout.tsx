import Link from "next/link";
import { User, Package, MapPin, CreditCard, RefreshCw, LogOut } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const LINKS = [
  { href: "/account", label: "Dashboard", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/subscriptions", label: "Subscriptions", icon: RefreshCw },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/payment-methods", label: "Payment methods", icon: CreditCard },
];

export default function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="container py-10 lg:py-16 grid lg:grid-cols-[240px_1fr] gap-10">
        <aside aria-label="Account navigation">
          <h1 className="font-display text-xl text-forest-800 mb-4">Your account</h1>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink/80 hover:bg-ivory-200 whitespace-nowrap"
              >
                <l.icon className="size-4 text-forest-600" />
                {l.label}
              </Link>
            ))}
            <form action="/api/auth/signout" method="post" className="mt-2 lg:mt-4">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-ink/75 hover:bg-ivory-200"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </form>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
      <Footer />
    </>
  );
}
