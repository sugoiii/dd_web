import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const oversightMetrics = [
  {
    title: "Data Freshness",
    value: "07:45 KST",
    description: "Last refresh from FO calc",
    trend: { value: "SLA met", direction: "flat" as const },
  },
  {
    title: "Open Breaks",
    value: "9",
    description: "Across all reconciliation scopes",
    trend: { value: "-3 vs yesterday", direction: "down" as const },
  },
  {
    title: "Pending Sign-offs",
    value: "4",
    description: "Preparer + reviewer outstanding",
    trend: { value: "Due EOD", direction: "flat" as const },
  },
  {
    title: "Cash Coverage",
    value: "98.2%",
    description: "Book vs bank in base CCY",
    trend: { value: "▲ 0.6%", direction: "up" as const },
  },
];

const statusVariant: Record<string, "default" | "outline" | "destructive"> = {
  RECONCILED: "default",
  BREAK: "destructive",
  PENDING: "outline",
};

const reconciliationSummary = [
  { scope: "Cash vs Bank", status: "BREAK", materiality: "High", ageing: "2 days", owner: "Ops" },
  { scope: "PnL vs Broker", status: "RECONCILED", materiality: "Medium", ageing: "Same day", owner: "MO" },
  { scope: "Accruals vs Actuals", status: "PENDING", materiality: "Medium", ageing: "Awaiting invoices", owner: "Finance" },
];

const signOffQueue = [
  {
    level: "Fund: Korea Equity Long/Short",
    preparer: "Minji Park @ 08:15",
    reviewer: "Pending",
    status: "PENDING",
  },
  {
    level: "Desk: Global Macro",
    preparer: "Ready",
    reviewer: "Signed 07:55",
    status: "RECONCILED",
  },
  {
    level: "Product: USD Swaptions",
    preparer: "Needs cash evidence",
    reviewer: "-",
    status: "BREAK",
  },
];

const toleranceProfiles = [
  {
    profile: "TIGHT",
    coverage: "Critical desks, FX option books",
    tolerance: "±$10K or 2 bps",
  },
  {
    profile: "STANDARD",
    coverage: "Daily Asia desks",
    tolerance: "±$50K or 5 bps",
  },
  {
    profile: "LOOSE",
    coverage: "Legacy funds in runoff",
    tolerance: "±$150K or 10 bps",
  },
];

export default function ManagementOverviewPage() {
  return (
    <PageTemplate
      title="Management Oversight"
      description="Evidence-driven dashboard for reconciliation health and certification readiness."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {oversightMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Status</CardTitle>
          <CardDescription>Aggregated view of control scopes tracked for today (UTC+9).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[30rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Scope</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Materiality</th>
                <th className="py-2 text-left font-medium">Ageing</th>
                <th className="py-2 text-left font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reconciliationSummary.map((row) => (
                <tr key={row.scope}>
                  <td className="py-2 font-medium">{row.scope}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant[row.status] ?? "outline"}>{row.status}</Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{row.materiality}</td>
                  <td className="py-2 text-muted-foreground">{row.ageing}</td>
                  <td className="py-2 text-muted-foreground">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-off Queue</CardTitle>
          <CardDescription>Tracks preparer and reviewer actions required before daily lock.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {signOffQueue.map((item) => (
              <li key={item.level} className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.level}</p>
                  <p className="text-xs text-muted-foreground">Preparer: {item.preparer}</p>
                  <p className="text-xs text-muted-foreground">Reviewer: {item.reviewer}</p>
                </div>
                <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tolerance Profiles</CardTitle>
          <CardDescription>Reference thresholds used when highlighting material breaks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toleranceProfiles.map((profile) => (
            <div key={profile.profile} className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{profile.profile}</p>
              <p className="mt-1 text-sm text-muted-foreground">{profile.coverage}</p>
              <p className="mt-3 text-base font-medium">{profile.tolerance}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
