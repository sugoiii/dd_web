import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const valuationMetrics = [
  {
    title: "Price Sources",
    value: "27",
    description: "Across equity & derivative books",
    trend: { value: "3 flagged", direction: "up" as const },
  },
  {
    title: "Overrides",
    value: "5",
    description: "Pending risk approval",
    trend: { value: "All supported", direction: "flat" as const },
  },
  {
    title: "Stale Quotes",
    value: "2",
    description: "> 4 hours old",
    trend: { value: "Escalated", direction: "up" as const },
  },
  {
    title: "Approvals",
    value: "18",
    description: "Signed in last 24h",
    trend: { value: "On target", direction: "flat" as const },
  },
];

const statusVariant: Record<string, "default" | "outline" | "destructive"> = {
  APPROVED: "default",
  OVERRIDDEN: "destructive",
  STALE: "destructive",
  REVIEW: "outline",
};

const valuationSources = [
  {
    instrument: "K200 Index Future",
    source: "KRX",
    lastPrice: "346.2",
    refreshed: "07:40",
    status: "APPROVED",
  },
  {
    instrument: "USD/KRW Spot",
    source: "Refinitiv",
    lastPrice: "1314.5",
    refreshed: "07:10",
    status: "REVIEW",
  },
  {
    instrument: "Nikkei Vol Surface",
    source: "Vendor X",
    lastPrice: "Provided",
    refreshed: "06:05",
    status: "STALE",
  },
  {
    instrument: "KOSPI ETF",
    source: "Composite",
    lastPrice: "45.22",
    refreshed: "07:38",
    status: "APPROVED",
  },
];

const overrideLog = [
  {
    id: "OVR-3001",
    desk: "ETN",
    rationale: "Model fallback due to missing borrow",
    submitted: "Preparer 07:05",
    reviewer: "Risk signed 07:25",
    status: "APPROVED",
  },
  {
    id: "OVR-2998",
    desk: "Credit",
    rationale: "Manual price from broker B",
    submitted: "Preparer 06:55",
    reviewer: "Awaiting Risk",
    status: "OVERRIDDEN",
  },
];

const slaBadges = [
  { feed: "Equity Close", frequency: "Daily", sla: "07:30", status: "On Time" },
  { feed: "Rates Curve", frequency: "Hourly", sla: "Top of hour", status: "Delayed" },
  { feed: "Option Greeks", frequency: "Real-time", sla: "Live", status: "Nominal" },
];

export default function ValuationOversightPage() {
  return (
    <PageTemplate
      title="Valuation Oversight"
      description="Track price source freshness, overrides, and approvals for management sign-off."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {valuationMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price Source Health</CardTitle>
          <CardDescription>Focus on sources feeding the management mode grid (Asia/Seoul).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Instrument</th>
                <th className="py-2 text-left font-medium">Source</th>
                <th className="py-2 text-left font-medium">Last Price</th>
                <th className="py-2 text-left font-medium">Refreshed</th>
                <th className="py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {valuationSources.map((row) => (
                <tr key={row.instrument}>
                  <td className="py-2 font-medium">{row.instrument}</td>
                  <td className="py-2 text-muted-foreground">{row.source}</td>
                  <td className="py-2 text-muted-foreground">{row.lastPrice}</td>
                  <td className="py-2 text-muted-foreground">{row.refreshed}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant[row.status] ?? "outline"}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Override Log</CardTitle>
          <CardDescription>Audit-ready history with preparer and reviewer timestamps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {overrideLog.map((item) => (
            <div key={item.id} className="rounded-md border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{item.id}</p>
                  <p className="text-xs text-muted-foreground">Desk: {item.desk}</p>
                </div>
                <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.rationale}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.submitted}</p>
              <p className="text-xs text-muted-foreground">{item.reviewer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA Badges</CardTitle>
          <CardDescription>Helps management identify stale data before sign-off.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {slaBadges.map((badge) => (
            <div key={badge.feed} className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{badge.feed}</p>
              <p className="mt-1 text-sm text-muted-foreground">Frequency: {badge.frequency}</p>
              <p className="mt-1 text-sm text-muted-foreground">SLA: {badge.sla}</p>
              <p className="mt-2 text-base font-medium">Status: {badge.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
