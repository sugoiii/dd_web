import { AlertTriangle, ShieldCheck, Target } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const summaryMetrics = [
  {
    title: "Total VaR (99%)",
    value: "$18.6M",
    trend: { value: "+$1.1M vs prior close", direction: "up" as const },
  },
  {
    title: "Limit Utilization",
    value: "72%",
    trend: { value: "Desk headroom 28%", direction: "up" as const },
  },
  {
    title: "Stress Loss (Crash)",
    value: "-$24.3M",
    trend: { value: "Within $30M guardrail", direction: "flat" as const },
  },
  {
    title: "Alerts Open",
    value: "5",
    trend: { value: "1 critical", direction: "down" as const },
  },
];

const limitUsage = [
  { label: "Delta", used: 68, limit: 100 },
  { label: "Vega", used: 74, limit: 100 },
  { label: "Gamma", used: 61, limit: 100 },
  { label: "Theta", used: 55, limit: 100 },
  { label: "Cross-Gamma", used: 47, limit: 100 },
];

const tenorRisk = [
  { tenor: "0-7d", delta: "-9.8k", gamma: "+$2.1M", vega: "$1.4M" },
  { tenor: "1-4w", delta: "-6.2k", gamma: "+$1.7M", vega: "$2.9M" },
  { tenor: "1-3m", delta: "+4.1k", gamma: "-$0.9M", vega: "$5.8M" },
  { tenor: "3-6m", delta: "+7.6k", gamma: "-$1.4M", vega: "$4.2M" },
  { tenor: "6m+", delta: "+11.3k", gamma: "-$2.6M", vega: "$3.7M" },
];

const riskIncidents = [
  {
    id: "risk-1",
    label: "SPX crash path breach",
    detail: "Crash scenario exceeds guardrail by $380K, evaluate fly overlay.",
    severity: "Critical",
  },
  {
    id: "risk-2",
    label: "NDX dispersion mismatch",
    detail: "Single-name short vol underperforming vs index hedge.",
    severity: "High",
  },
  {
    id: "risk-3",
    label: "Rates correlation drift",
    detail: "Gamma beta to TY futures outside historical band.",
    severity: "Medium",
  },
  {
    id: "risk-4",
    label: "Crypto vol supply",
    detail: "Client flow short dated calls; inventory threshold approaching.",
    severity: "Advisory",
  },
];

const severityTone: Record<(typeof riskIncidents)[number]["severity"], string> = {
  Critical: "border-rose-500/60 bg-rose-500/10 text-rose-600",
  High: "border-amber-500/60 bg-amber-500/10 text-amber-600",
  Medium: "border-sky-500/60 bg-sky-500/10 text-sky-600",
  Advisory: "border-muted/60 bg-muted text-muted-foreground",
};

const hedgingAgenda = [
  {
    title: "Add crash put fly",
    detail: "Deploy SPX Sep 5%/10% put fly to cap tail risk.",
    owner: "Delta Pod",
    status: "In-flight",
  },
  {
    title: "Scale calendar spread",
    detail: "Roll QQQ 1M long gamma into 2M to smooth vega ramp.",
    owner: "Vol Pod",
    status: "Planned",
  },
  {
    title: "Variance swap pair",
    detail: "Offset BTC short vega with ETH long variance block.",
    owner: "Digital",
    status: "Monitoring",
  },
];

const statusTone: Record<(typeof hedgingAgenda)[number]["status"], string> = {
  "In-flight": "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  Planned: "border-amber-500/60 bg-amber-500/10 text-amber-600",
  Monitoring: "border-sky-500/60 bg-sky-500/10 text-sky-600",
};

export default function OptionsRiskDashboard() {
  return (
    <PageTemplate
      title="Options Risk Dashboard"
      description="Live overview of limit utilization, stress paths, and mitigation plans."
      actions={
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="size-4" />
          Run Limits Check
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Limit Utilization</CardTitle>
            <CardDescription>Core risk factors vs desk limits with visual thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={limitUsage}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  label={{ value: "% of limit", angle: -90, position: "insideLeft", offset: -6 }}
                />
                <Tooltip cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                <ReferenceLine y={85} stroke="#fb923c" strokeDasharray="4 4" label={{ value: "Alert", position: "insideTop" }} />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="6 2" label={{ value: "Limit", position: "insideTop" }} />
                <Bar dataKey="used" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Risk Alerts</CardTitle>
            <CardDescription>Heat-map of watch items requiring trader response.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {riskIncidents.map((incident) => (
              <div key={incident.id} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className={`mt-0.5 border ${severityTone[incident.severity]}`}>
                    {incident.severity}
                  </Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{incident.label}</p>
                    <p className="text-xs text-muted-foreground">{incident.detail}</p>
                  </div>
                </div>
                <AlertTriangle className="mt-0.5 size-4 text-amber-500" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk by Tenor</CardTitle>
          <CardDescription>Aggregate desk positioning across expiries and Greeks.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[48rem] table-fixed text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 text-left font-medium">Tenor Bucket</th>
                <th className="py-2 text-left font-medium">Net Delta</th>
                <th className="py-2 text-left font-medium">Net Gamma</th>
                <th className="py-2 text-left font-medium">Net Vega</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenorRisk.map((row) => (
                <tr key={row.tenor}>
                  <td className="py-2 font-semibold">{row.tenor}</td>
                  <td className="py-2 text-muted-foreground">{row.delta}</td>
                  <td className="py-2 text-muted-foreground">{row.gamma}</td>
                  <td className="py-2 text-muted-foreground">{row.vega}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hedging Agenda</CardTitle>
          <CardDescription>Execution roadmap to normalize exposures.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {hedgingAgenda.map((item) => (
            <div key={item.title} className="flex flex-col gap-2 rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{item.title}</p>
                <Badge variant="outline" className={`border ${statusTone[item.status]}`}>
                  <Target className="mr-1 size-3" />
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
              <p className="text-xs font-medium text-muted-foreground">Owner: {item.owner}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
