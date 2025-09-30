import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const summaryMetrics = [
  {
    title: "Products Quoted",
    value: "50",
    trend: { value: "+4 vs yesterday", direction: "up" as const },
  },
  {
    title: "Quote Health",
    value: "94.2%",
    trend: { value: "Avg spread 3.1 bps", direction: "up" as const },
  },
  {
    title: "Risk Drift",
    value: "Δ $1.6M",
    trend: { value: "Inside ±$3M envelope", direction: "flat" as const },
  },
  {
    title: "Deals (1h)",
    value: "28",
    trend: { value: "$41M notionals", direction: "up" as const },
  },
];

const liquidityBands = Array.from({ length: 12 }, (_, idx) => ({
  bucket: `${idx * 5}-${idx * 5 + 5}`,
  spread: 1.8 + (idx % 3) * 0.6 + idx * 0.05,
  depth: 3.2 + (idx % 4) * 0.9,
  hits: 18 + (idx % 5) * 6,
}));

const anomalySignals = [
  {
    label: "Quote Fadeouts",
    detail: "SX5E flies unstable 08:45Z",
    severity: "High",
    icon: TrendingDown,
    tone: "text-rose-500 border-rose-200 bg-rose-50",
  },
  {
    label: "Inventory Tilt",
    detail: "Gamma stacking in SPX weeklies",
    severity: "Medium",
    icon: TrendingUp,
    tone: "text-amber-500 border-amber-200 bg-amber-50",
  },
  {
    label: "Latency Spike",
    detail: "CBOE quotes +64 ms vs baseline",
    severity: "Elevated",
    icon: Zap,
    tone: "text-sky-500 border-sky-200 bg-sky-50",
  },
];

const hedgeStatus = [
  {
    book: "Index Futures",
    delta: "-11.2k",
    gamma: "+0.84k",
    vega: "$1.6M",
    theta: "-$78K",
    coverage: "92%",
    action: "Trim 200 ES ahead of CPI print",
  },
  {
    book: "ETF Overlays",
    delta: "+8.6k",
    gamma: "+0.11k",
    vega: "$0.5M",
    theta: "-$18K",
    coverage: "89%",
    action: "Roll QQQ Jul → Aug",
  },
  {
    book: "Variance Swaps",
    delta: "Flat",
    gamma: "-0.06k",
    vega: "$2.7M",
    theta: "-$142K",
    coverage: "97%",
    action: "Watch contango steepening",
  },
  {
    book: "FX Overlay",
    delta: "-$3.8M",
    gamma: "Flat",
    vega: "$0.3M",
    theta: "-$12K",
    coverage: "86%",
    action: "Buy GBPUSD digital cover",
  },
];

const venueLatency = [
  { venue: "CME", latency: 46, baseline: 38 },
  { venue: "CBOE", latency: 79, baseline: 42 },
  { venue: "Eurex", latency: 58, baseline: 45 },
  { venue: "SGX", latency: 71, baseline: 53 },
  { venue: "HKEX", latency: 62, baseline: 55 },
  { venue: "ICE", latency: 49, baseline: 40 },
];

const dealStream = Array.from({ length: 12 }, (_, idx) => {
  const hour = String(8 + Math.floor(idx / 2)).padStart(2, "0");
  const minute = String((idx * 5 + 7) % 60).padStart(2, "0");

  return {
    id: idx + 1,
    time: `${hour}:${minute} UTC`,
    product: ["SPX Jun25", "NDX Sep25", "SX5E Mar25", "HSI Jul25"][idx % 4],
    side: idx % 2 === 0 ? "Lifted" : "Hit",
    size: `${(idx % 5) * 25 + 40} lots`,
    price: (112.4 + idx * 0.35).toFixed(2),
    impact: ["Tight", "Neutral", "Wide"][idx % 3],
  };
});

const productUniverse = Array.from({ length: 50 }, (_, index) => {
  const symbols = [
    "SPX Jun25",
    "NDX Jun25",
    "RTY Jun25",
    "DAX Sep25",
    "HSI Jul25",
    "NKY Sep25",
    "SX5E Sep25",
    "SPX Skew",
    "VIX Call",
    "AI Infra Basket",
  ];
  const venues = ["CME", "CBOE", "Eurex", "SGX", "HKEX", "OSE", "ICE"];
  const status = index % 17 === 0 ? "Halted" : index % 9 === 0 ? "Watch" : "Active";
  const mid = 112 + index * 0.85 + (index % 7) * 0.4;
  const spreadBps = 2 + (index % 4) * 0.55;
  const bid = mid * (1 - spreadBps / 20000);
  const ask = mid * (1 + spreadBps / 20000);

  return {
    id: `${symbols[index % symbols.length]}-${index + 1}`,
    symbol: symbols[index % symbols.length],
    venue: venues[index % venues.length],
    status,
    bid: bid.toFixed(2),
    ask: ask.toFixed(2),
    spreadBps: spreadBps.toFixed(2),
    hitRate: 44 + ((index * 5) % 36),
    inventory: (index % 8) * 12 - 24,
  };
});

const statusBadge: Record<(typeof productUniverse)[number]["status"], string> = {
  Active: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600",
  Watch: "border-amber-500/50 bg-amber-500/10 text-amber-600",
  Halted: "border-rose-500/50 bg-rose-500/10 text-rose-600",
};

const unusualFlows = Array.from({ length: 16 }, (_, idx) => ({
  region: ["US", "EU", "Asia", "LATAM"][idx % 4],
  trigger: ["Dispersion", "Dealer unwind", "Client RFQ", "Macro hedge"][idx % 4],
  magnitude: ((idx * 13) % 91) + 9,
  heat: 40 + (idx % 5) * 12,
}));

export default function MarketMakingMonitor() {
  return (
    <PageTemplate
      title="Market Making Command Center"
      description="Comprehensive view across streaming quotes, hedge posture, venue health, and anomaly surveillance."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr]">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Liquidity Profile</CardTitle>
            <CardDescription>
              Spread, displayed depth, and hit rate across aggregated size buckets.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={liquidityBands} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(15, 118, 110, 0.08)" }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="spread"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3) / 0.25)"
                  strokeWidth={2}
                  name="Spread (bps)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="hits"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  name="Hit Count"
                />
                <Bar yAxisId="left" dataKey="depth" barSize={14} fill="hsl(var(--chart-5) / 0.7)" name="Depth (mm)" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Anomaly Radar</CardTitle>
              <CardDescription>Signals bubbling up from automated surveillance.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View log
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {anomalySignals.map((signal) => (
              <div
                key={signal.label}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 shadow-sm ${signal.tone}`}
              >
                <signal.icon className="mt-1 h-5 w-5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium leading-none">{signal.label}</p>
                    <Badge variant="outline" className="border-current px-2 py-0 text-xs">
                      {signal.severity}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{signal.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Venue Latency</CardTitle>
            <CardDescription>Baseline vs current round trip in milliseconds.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={venueLatency} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="venue" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: "rgba(14, 165, 233, 0.08)" }} />
                <Bar dataKey="baseline" fill="hsl(var(--chart-4) / 0.5)" name="Baseline" radius={[4, 4, 0, 0]} />
                <Bar dataKey="latency" fill="hsl(var(--chart-2))" name="Current" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quoting Universe</CardTitle>
            <CardDescription>
              50 product surfaces with live bid/ask, spread diagnostics, and inventory skew.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border">
            <div className="grid max-h-[420px] grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_repeat(5,minmax(0,1fr))] overflow-y-auto text-sm">
              <div className="sticky top-0 z-10 grid grid-cols-subgrid items-center gap-2 border-b bg-background px-3 py-2 font-medium">
                <span>Symbol</span>
                <span>Venue</span>
                <span>Status</span>
                <span>Bid</span>
                <span>Ask</span>
                <span>Spread (bps)</span>
                <span>Hit Rate</span>
                <span>Inventory</span>
              </div>
              {productUniverse.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-subgrid items-center gap-2 border-b px-3 py-2 last:border-b-0"
                >
                  <span className="truncate font-medium">{product.symbol}</span>
                  <span className="text-muted-foreground">{product.venue}</span>
                  <Badge variant="outline" className={`${statusBadge[product.status]} px-2 py-0 text-xs font-semibold`}>
                    {product.status}
                  </Badge>
                  <span>{product.bid}</span>
                  <span>{product.ask}</span>
                  <span>{product.spreadBps}</span>
                  <span>{product.hitRate}%</span>
                  <span className={product.inventory > 0 ? "text-emerald-600" : product.inventory < 0 ? "text-rose-600" : ""}>
                    {product.inventory > 0 ? "+" : ""}
                    {product.inventory}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Hedge Dashboard</CardTitle>
              <CardDescription>Desk-level delta, gamma, vega, and theta posture with next steps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {hedgeStatus.map((hedge) => (
                <div key={hedge.book} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{hedge.book}</p>
                    <Badge variant="outline" className="px-2 py-0 text-xs">
                      {hedge.coverage}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                    <span>Δ {hedge.delta}</span>
                    <span>Γ {hedge.gamma}</span>
                    <span>V {hedge.vega}</span>
                    <span>Θ {hedge.theta}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{hedge.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Realtime Deal Tape</CardTitle>
              <CardDescription>Sequenced executions with size, side, and microstructure impact.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[220px] space-y-3 overflow-y-auto">
              {dealStream.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
                  <div>
                    <p className="font-medium leading-tight">{deal.product}</p>
                    <p className="text-xs text-muted-foreground">{deal.time} · {deal.side}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">{deal.size}</p>
                    <p className="text-xs text-muted-foreground">{deal.price} · {deal.impact}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unusual Flow Heatmap</CardTitle>
          <CardDescription>
            Region and trigger level snapshot highlighting outsized activity and potential dislocations.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid min-w-[640px] grid-cols-8 gap-2">
            {unusualFlows.map((flow, idx) => (
              <div
                key={`${flow.region}-${idx}`}
                className="flex flex-col gap-1 rounded-lg border bg-muted/10 p-3 text-xs"
              >
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{flow.region}</span>
                  <span>{flow.trigger}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(flow.magnitude, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Heat: {flow.heat}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vol Surface Watch</CardTitle>
          <CardDescription>Tracking smile shifts vs prior close across tenor buckets.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 16, left: -10, bottom: 12 }}>
              <CartesianGrid strokeDasharray="2 4" strokeOpacity={0.2} />
              <XAxis type="number" dataKey="tenor" name="Tenor" unit="d" tickLine={false} axisLine={false} />
              <YAxis
                type="number"
                dataKey="shift"
                name="Shift"
                unit="bps"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip cursor={{ stroke: "hsl(var(--foreground) / 0.2)" }} />
              <Scatter
                name="Smile Shift"
                data={Array.from({ length: 18 }, (_, idx) => ({
                  tenor: (idx % 6) * 30 + 30,
                  shift: -25 + (idx % 7) * 9 - idx,
                }))}
                fill="hsl(var(--chart-2))"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
