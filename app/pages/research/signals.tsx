import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const signalSummary = [
  { title: "Live Signals", value: "18", trend: { value: "+2 w/w", direction: "up" as const } },
  { title: "Watchlist", value: "7", trend: { value: "Pending QA", direction: "flat" as const } },
  { title: "Sharpe (median)", value: "1.4", trend: { value: "Backtest", direction: "up" as const } },
  { title: "Deployment Queue", value: "3", trend: { value: "Requires infra", direction: "down" as const } },
];

const signalLibrary = [
  {
    name: "Volatility Crush",
    status: "Live",
    description: "Fades skew expansion post-earnings for high-dispersion baskets.",
    horizon: "1-3 days",
    owner: "Desk Quant",
  },
  {
    name: "Liquidity Pulse",
    status: "Pilot",
    description: "Tracks block-trade footprints to anticipate ETF flow directionality.",
    horizon: "Intraday",
    owner: "Data Science",
  },
  {
    name: "Carry Stack",
    status: "Research",
    description: "Combines rates, vol and basis signals to rank cross-asset carry trades.",
    horizon: "1-4 weeks",
    owner: "Macro Strategy",
  },
];

const reviewChecklist = [
  "Document factor assumptions and guardrails.",
  "Schedule code review with production engineering.",
  "Validate dataset refresh cadence and completeness.",
];

export default function SignalLibraryPage() {
  return (
    <PageTemplate title="Signal Library" description="Prototype ideas staged for validation and production roll-out.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {signalSummary.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Queue</CardTitle>
          <CardDescription>Signals grouped by readiness state.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {signalLibrary.map((signal) => (
            <div key={signal.name} className="rounded-md border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{signal.name}</h3>
                <Badge variant="secondary">{signal.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{signal.description}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Horizon</dt>
                  <dd className="font-medium">{signal.horizon}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="font-medium">{signal.owner}</dd>
                </div>
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Review</CardTitle>
          <CardDescription>Prep checklist for Friday's investment committee.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {reviewChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
