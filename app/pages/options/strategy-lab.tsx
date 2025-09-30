import { Calculator, Layers, Lightbulb, Wand2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
    title: "Strategy Edge",
    value: "+$1.9M",
    trend: { value: "+$420K vs prior session", direction: "up" as const },
  },
  {
    title: "Capital At Risk",
    value: "$12.4M",
    trend: { value: "Inside $15M desk ceiling", direction: "flat" as const },
  },
  {
    title: "Convexity Budget",
    value: "62% deployed",
    trend: { value: "Room to add +18%", direction: "up" as const },
  },
  {
    title: "Scenario Breaches",
    value: "1 of 28",
    trend: { value: "Review QQQ crash path", direction: "down" as const },
  },
];

const scenarioCurves = [
  { move: "-5%", current: -3.2, adjusted: -1.7 },
  { move: "-3%", current: -1.8, adjusted: -0.8 },
  { move: "-1%", current: -0.6, adjusted: 0.1 },
  { move: "0%", current: 0, adjusted: 0 },
  { move: "+1%", current: 0.5, adjusted: 0.7 },
  { move: "+3%", current: 1.4, adjusted: 1.9 },
  { move: "+5%", current: 2.6, adjusted: 3.4 },
];

const strategyPlaybook = [
  {
    label: "SPX Diagonal Hedge",
    objective: "Transfer event risk into theta-friendly diagonal",
    structure: "Buy 3M 0.25Δ call / Sell 1M 0.35Δ call",
    pnl: "+$410K",
    risk: "Δ -3.2k | Γ +$0.6M | Vega +$1.1M",
  },
  {
    label: "NDX Dispersion Sleeve",
    objective: "Harvest vol premium vs top tech constituents",
    structure: "Sell index straddle / Buy single name call spreads",
    pnl: "+$290K",
    risk: "Δ +1.7k | Γ -$0.3M | Vega -$0.9M",
  },
  {
    label: "Rate Vol Overlay",
    objective: "Neutralize cross-gamma with rates fly",
    structure: "Buy TY 2M strangle / Sell 10Y payer fly",
    pnl: "+$120K",
    risk: "Δ flat | Γ +$0.2M | Vega +$0.4M",
  },
];

const adjustmentChecklist = [
  {
    id: "adj-1",
    title: "Roll SPX weeklies into monthlies",
    detail: "Lock in gains on 0DTE scalps and extend gamma inventory.",
    status: "Ready",
  },
  {
    id: "adj-2",
    title: "Add skew protection via QQQ 25Δ puts",
    detail: "Crash scenario still breaching desk guardrail by $220K.",
    status: "Needs Review",
  },
  {
    id: "adj-3",
    title: "Deploy crypto variance swap pair",
    detail: "Align BTC variance with ETH vol regime to release convexity budget.",
    status: "Queued",
  },
];

const checklistTone: Record<(typeof adjustmentChecklist)[number]["status"], string> = {
  Ready: "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  "Needs Review": "border-amber-500/60 bg-amber-500/10 text-amber-600",
  Queued: "border-sky-500/60 bg-sky-500/10 text-sky-600",
};

const ideaQueue = [
  {
    name: "AI Leaders Collar",
    context: "Structure OTC collar for concentrated tech holdings",
    owner: "Equity Solutions",
    timeline: "Draft term sheet",
  },
  {
    name: "FX Macro Overlay",
    context: "Tie USDJPY skew to SPX crash hedge for macro fund",
    owner: "Macro Trading",
    timeline: "Backtest in progress",
  },
  {
    name: "Energy Vol Pack",
    context: "Bundle CL/NG calendar flys for supply shock coverage",
    owner: "Commodities",
    timeline: "Review with sales",
  },
  {
    name: "Crypto Basis Roll",
    context: "Capture funding dislocation via quarterly roll switch",
    owner: "Digital Assets",
    timeline: "Awaiting liquidity",
  },
];

export default function OptionsStrategyLab() {
  return (
    <PageTemplate
      title="Options Strategy Lab"
      description="Structure hedges, test scenarios, and coordinate adjustments across the book."
      actions={
        <>
          <Button variant="outline" size="sm" className="gap-2">
            <Calculator className="size-4" />
            Recalculate Greeks
          </Button>
          <Button size="sm" className="gap-2">
            <Wand2 className="size-4" />
            Generate Playbook
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scenario Curves</CardTitle>
            <CardDescription>P&L profile vs underlying shock with proposed adjustments.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scenarioCurves}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="move" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  label={{ value: "P&L ($MM)", angle: -90, position: "insideLeft", offset: -6 }}
                />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="current" name="Current" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="adjusted"
                  name="With Adjustments"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjustment Checklist</CardTitle>
            <CardDescription>Execution readiness across the highest impact changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adjustmentChecklist.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <Badge variant="outline" className={`mt-0.5 border ${checklistTone[item.status]}`}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Strategy Playbook</CardTitle>
          <CardDescription>Key structures, objectives, and risk footprint per initiative.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {strategyPlaybook.map((strategy) => (
            <div key={strategy.label} className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{strategy.label}</p>
                <Badge variant="outline" className="border border-primary/60 text-primary">
                  <Layers className="mr-1 size-3" /> Structures
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{strategy.objective}</p>
                <p>{strategy.structure}</p>
                <p>{strategy.risk}</p>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Net P&L</span>
                <span className="text-emerald-600">{strategy.pnl}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Idea Incubator</CardTitle>
          <CardDescription>Upcoming structures sourced from research and sales coverage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ideaQueue.map((idea) => (
            <div key={idea.name} className="flex flex-col gap-2 rounded-lg border bg-muted/10 p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-amber-500" />
                <p className="text-sm font-semibold">{idea.name}</p>
              </div>
              <p className="text-xs text-muted-foreground">{idea.context}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{idea.owner}</span>
                <span>{idea.timeline}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
