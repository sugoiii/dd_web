import { NavLink, Outlet } from "react-router";

import { cn } from "~/lib/utils";

const navItems = [
  { label: "Overview", to: ".", end: true },
  { label: "PnL", to: "pnl" },
  { label: "Realtime", to: "realtime" },
  { label: "Holdings", to: "holdings" },
];

export default function EtnLayout() {
  return (
    <div className="flex flex-col gap-6">
      <section className="border-b bg-muted/30 px-6 py-4">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ETN</p>
            <h2 className="text-xl font-semibold">Exchange Traded Note Desk</h2>
            <p className="text-sm text-muted-foreground">Monitor exposures, hedges, and live positioning views.</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full border px-3 py-1 text-sm font-medium transition",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </section>
      <div className="px-6 pb-6">
        <Outlet />
      </div>
    </div>
  );
}
