import { Activity, AlertTriangle, Signal } from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
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
    title: "Live P&L",
    value: "+$2.7M",
    trend: { value: "+$320K vs prior hour", direction: "up" as const },
  },
  {
    title: "Net Delta",
    value: "-18.4k",
    trend: { value: "Inside ±25k limit", direction: "flat" as const },
  },
  {
    title: "Gamma Exposure",
    value: "+$1.2M",
    trend: { value: "Steepening in weeklies", direction: "up" as const },
  },
  {
    title: "Vega at Risk",
    value: "$6.5M",
    trend: { value: "-0.8M vs open", direction: "down" as const },
  },
  {
    title: "Theoretical Edge",
    value: "+12.4 bps",
    trend: { value: "Across top 50 underlyings", direction: "up" as const },
  },
  {
    title: "Alerts Open",
    value: "7",
    trend: { value: "2 critical", direction: "down" as const },
  },
];

const underlyingBoard = [
  {
    symbol: "SPX",
    spot: "5204.8",
    change: "+0.7%",
    iv30: "18.4",
    netGamma: "-$12.1M",
    vega: "$3.2M",
    flow: "Client sweep",
    tone: "buy",
  },
  {
    symbol: "NDX",
    spot: "18234.6",
    change: "+1.1%",
    iv30: "22.8",
    netGamma: "-$7.8M",
    vega: "$2.1M",
    flow: "Dealer unwind",
    tone: "sell",
  },
  {
    symbol: "RTY",
    spot: "2089.2",
    change: "-0.4%",
    iv30: "26.1",
    netGamma: "+$4.3M",
    vega: "$1.4M",
    flow: "ETF overlay",
    tone: "neutral",
  },
  {
    symbol: "DAX",
    spot: "17245.5",
    change: "+0.2%",
    iv30: "20.6",
    netGamma: "-$2.6M",
    vega: "$0.8M",
    flow: "Program trade",
    tone: "buy",
  },
  {
    symbol: "HSI",
    spot: "18756.1",
    change: "-1.2%",
    iv30: "29.4",
    netGamma: "+$6.9M",
    vega: "$1.9M",
    flow: "Macro hedge",
    tone: "sell",
  },
  {
    symbol: "CL1",
    spot: "78.42",
    change: "+0.5%",
    iv30: "34.7",
    netGamma: "-$1.1M",
    vega: "$0.6M",
    flow: "Fly roll",
    tone: "neutral",
  },
  {
    symbol: "GC1",
    spot: "2351.7",
    change: "+0.9%",
    iv30: "17.9",
    netGamma: "-$0.6M",
    vega: "$0.4M",
    flow: "Call overwrite",
    tone: "sell",
  },
  {
    symbol: "BTC",
    spot: "67150",
    change: "-2.8%",
    iv30: "58.3",
    netGamma: "+$9.8M",
    vega: "$3.7M",
    flow: "Block print",
    tone: "buy",
  },
];

const toneClass: Record<(typeof underlyingBoard)[number]["tone"], string> = {
  buy: "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  sell: "border-rose-500/60 bg-rose-500/10 text-rose-600",
  neutral: "border-sky-500/50 bg-sky-500/10 text-sky-600",
};

const greeksTimeseries = [
  { time: "08:30", netDelta: -24, netVega: 7.2, theta: -0.9 },
  { time: "09:00", netDelta: -19, netVega: 6.8, theta: -0.8 },
  { time: "09:30", netDelta: -15, netVega: 6.1, theta: -0.7 },
  { time: "10:00", netDelta: -12, netVega: 5.6, theta: -0.65 },
  { time: "10:30", netDelta: -18, netVega: 6.4, theta: -0.72 },
  { time: "11:00", netDelta: -16, netVega: 6.8, theta: -0.75 },
  { time: "11:30", netDelta: -14, netVega: 7.1, theta: -0.78 },
  { time: "12:00", netDelta: -18, netVega: 7.5, theta: -0.81 },
];

const volSurface = [
  { tenor: "1W", atm: 18.4, rr25: -1.6, fly: 0.9 },
  { tenor: "1M", atm: 19.8, rr25: -2.1, fly: 1.1 },
  { tenor: "3M", atm: 21.2, rr25: -2.4, fly: 1.4 },
  { tenor: "6M", atm: 22.6, rr25: -2.8, fly: 1.7 },
  { tenor: "1Y", atm: 23.3, rr25: -3.1, fly: 1.9 },
];

const riskAlerts = [
  {
    id: "alert-1",
    label: "SPX gamma limit",
    detail: "Weeklies flipped short $15M gamma post CPI sweep",
    severity: "Critical",
  },
  {
    id: "alert-2",
    label: "NDX skew kink",
    detail: "25d risk reversals -45 bps vs model fair",
    severity: "High",
  },
  {
    id: "alert-3",
    label: "Variance swap hedge",
    detail: "Dispersion desk short vega, request cross coverage",
    severity: "Medium",
  },
  {
    id: "alert-4",
    label: "Rate vol correlation",
    detail: "USDJPY vol beta exceeding 0.8 threshold",
    severity: "Advisory",
  },
];

const alertTone: Record<(typeof riskAlerts)[number]["severity"], string> = {
  Critical: "border-rose-500/60 bg-rose-500/10 text-rose-600",
  High: "border-amber-500/60 bg-amber-500/10 text-amber-600",
  Medium: "border-sky-500/60 bg-sky-500/10 text-sky-600",
  Advisory: "border-muted/60 bg-muted text-muted-foreground",
};

const orderFlow = [
  {
    time: "12:04:18",
    client: "Tier 1 Asset Manager",
    product: "SPX 06/21 5200C",
    side: "Buy",
    size: "1,200",
    venue: "CBOE",
    color: "buy",
  },
  {
    time: "12:02:11",
    client: "Global Macro HF",
    product: "NDX 07/19 15000P",
    side: "Sell",
    size: "850",
    venue: "NASDAQ",
    color: "sell",
  },
  {
    time: "11:58:42",
    client: "Retail wholesaler",
    product: "AAPL 06/07 185C",
    side: "Buy",
    size: "5,000",
    venue: "PSE",
    color: "buy",
  },
  {
    time: "11:54:20",
    client: "Insurance desk",
    product: "SPX 12/20 4500P",
    side: "Sell",
    size: "600",
    venue: "CBOE",
    color: "sell",
  },
  {
    time: "11:49:08",
    client: "Systematic PM",
    product: "TSLA 06/14 200C",
    side: "Buy",
    size: "2,200",
    venue: "NYSE",
    color: "buy",
  },
];

const flowTone: Record<(typeof orderFlow)[number]["color"], string> = {
  buy: "text-emerald-600",
  sell: "text-rose-600",
};

const hedgePlaybook = [
  {
    title: "Gamma flattening",
    action: "Roll 2.5k SPX 1w calls into futures delta hedge",
    owner: "Delta Pod",
    status: "In-flight",
  },
  {
    title: "Vega compression",
    action: "Initiate calendar fly: sell 3M buy 6M to reduce tail risk",
    owner: "Vol Pod",
    status: "Queued",
  },
  {
    title: "Crypto overlay",
    action: "Buy BTC variance vs sell ETH call spread to rebalance beta",
    owner: "Digital",
    status: "Monitoring",
  },
];

const statusTone: Record<(typeof hedgePlaybook)[number]["status"], string> = {
  "In-flight": "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  Queued: "border-amber-500/60 bg-amber-500/10 text-amber-600",
  Monitoring: "border-sky-500/60 bg-sky-500/10 text-sky-600",
};

export default function OptionsRealtimeMonitor() {
  return (
    <PageTemplate
      title="Options Trading Live Monitor"
      description="Integrated command center consolidating Greeks, vol surfaces, flow, and hedge posture for the listed options desk."
      actions={
        <>
          <Button variant="outline" size="sm">
            Pause Stream
          </Button>
          <Button size="sm" className="gap-2">
            <Activity className="size-4" />
            Deploy Hedge Ticket
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Core Underlying Board</CardTitle>
            <CardDescription>Live Greeks, realized flows, and skew context across strategic underlyings.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[52rem] table-fixed text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-2 text-left font-medium">Underlying</th>
                  <th className="py-2 text-left font-medium">Spot</th>
                  <th className="py-2 text-left font-medium">Δ</th>
                  <th className="py-2 text-left font-medium">IV30</th>
                  <th className="py-2 text-left font-medium">Net Gamma</th>
                  <th className="py-2 text-left font-medium">Net Vega</th>
                  <th className="py-2 text-left font-medium">Dominant Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {underlyingBoard.map((row) => (
                  <tr key={row.symbol}>
                    <td className="py-2 font-semibold">{row.symbol}</td>
                    <td className="py-2 text-muted-foreground">{row.spot}</td>
                    <td className="py-2 text-muted-foreground">{row.change}</td>
                    <td className="py-2 text-muted-foreground">{row.iv30}</td>
                    <td className="py-2 text-muted-foreground">{row.netGamma}</td>
                    <td className="py-2 text-muted-foreground">{row.vega}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass[row.tone]}`}>
                        <Signal className="size-3" />
                        {row.flow}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Intraday Greeks</CardTitle>
              <CardDescription>Net desk profile with auto-hedge envelopes.</CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={greeksTimeseries}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    yAxisId="delta"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    label={{ value: "Net Δ (k)", angle: -90, position: "insideLeft", offset: -4 }}
                  />
                  <YAxis
                    yAxisId="vega"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    label={{ value: "Vega ($M)", angle: 90, position: "insideRight", offset: -8 }}
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Area type="monotone" dataKey="netDelta" name="Net Δ (k)" fill="#0ea5e9" fillOpacity={0.2} stroke="#0ea5e9" yAxisId="delta" />
                  <Line type="monotone" dataKey="netVega" name="Net Vega ($M)" stroke="#22c55e" strokeWidth={2} yAxisId="vega" />
                  <Line type="monotone" dataKey="theta" name="Theta ($M)" stroke="#f97316" strokeDasharray="5 5" yAxisId="vega" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk & Alerts</CardTitle>
              <CardDescription>Limit monitors and structural anomalies requiring action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className={`mt-0.5 border ${alertTone[alert.severity]}`}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold">{alert.label}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <AlertTriangle className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Volatility Surface Snapshot</CardTitle>
            <CardDescription>ATM term structure with smile diagnostics against model fair.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volSurface}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="tenor" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  yAxisId="atm"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  label={{ value: "Vol %", angle: -90, position: "insideLeft", offset: -4 }}
                />
                <YAxis
                  yAxisId="smile"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  label={{ value: "Smile (bps)", angle: 90, position: "insideRight", offset: -8 }}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="atm" name="ATM Vol" fill="#6366f1" fillOpacity={0.15} stroke="#6366f1" yAxisId="atm" />
                <Bar dataKey="rr25" name="25Δ RR" fill="#f97316" yAxisId="smile" barSize={22} />
                <Line type="monotone" dataKey="fly" name="25Δ Fly" stroke="#14b8a6" strokeWidth={2} yAxisId="smile" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Flow Tape</CardTitle>
            <CardDescription>High touch and electronic sweeps with routing attribution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderFlow.map((item) => (
              <div key={item.time} className="flex flex-col gap-1 rounded-lg border bg-muted/20 p-3 text-sm">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.time}</span>
                  <span>{item.venue}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{item.product}</p>
                  <span className={`text-sm font-semibold ${flowTone[item.color]}`}>{item.side}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.client}</span>
                  <span>{item.size} lots</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hedge Playbook</CardTitle>
          <CardDescription>Coordinated actions, ownership, and execution readiness.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {hedgePlaybook.map((item) => (
            <div key={item.title} className="flex flex-col gap-2 rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{item.title}</p>
                <Badge variant="outline" className={`border ${statusTone[item.status]}`}>
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.action}</p>
              <p className="text-xs font-medium text-muted-foreground">Owner: {item.owner}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
