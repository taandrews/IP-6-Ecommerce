import { DollarSign, ShoppingCart, Users, RefreshCw, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// In production, aggregate from AnalyticsDaily table. Mock values reflect the shape.
async function getMetrics() {
  return {
    revenue7d: 482500,
    orders7d: 63,
    newCustomers7d: 41,
    activeSubs: 284,
    conversionRate: 3.2,
    topProducts: [
      { sku: "SUP-IP6-CAP-60", name: "IP6 Original · Capsules 60ct", revenue: 185300, units: 52 },
      { sku: "FIL-CITRATE-UNIT", name: "IP6-Citrate Water Filter", revenue: 148900, units: 14 },
      { sku: "SKN-LSC-ECZ-50", name: "La Santé · Eczema 50ml", revenue: 92400, units: 31 },
    ],
  };
}

export default async function AdminOverviewPage() {
  const m = await getMetrics();
  return (
    <>
      <header className="mb-8">
        <p className="eyebrow mb-1">Last 7 days</p>
        <h1 className="font-display text-display-md text-forest-800">Store overview</h1>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat icon={DollarSign} label="Revenue" value={formatPrice(m.revenue7d)} />
        <Stat icon={ShoppingCart} label="Orders" value={m.orders7d.toString()} />
        <Stat icon={Users} label="New customers" value={m.newCustomers7d.toString()} />
        <Stat icon={RefreshCw} label="Active subscriptions" value={m.activeSubs.toString()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-display text-xl text-forest-800 mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-forest-600" /> Top products
          </h2>
          <ul className="divide-y divide-ivory-300">
            {m.topProducts.map((p) => (
              <li key={p.sku} className="py-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-ink/60">{p.sku} · {p.units} units</div>
                </div>
                <div className="font-medium">{formatPrice(p.revenue)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl text-forest-800 mb-4">Conversion</h2>
          <div className="text-4xl font-display text-forest-800">{m.conversionRate.toFixed(1)}%</div>
          <p className="text-sm text-ink/60 mt-2">
            Share of visitors who completed an order in the last 7 days.
          </p>
        </div>
      </div>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <Icon className="size-5 text-gold-500 mb-3" />
      <div className="text-xs uppercase tracking-[0.18em] text-ink/60">{label}</div>
      <div className="mt-1 text-2xl font-display text-forest-800">{value}</div>
    </div>
  );
}
