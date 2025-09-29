import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const riskMetrics = [
  { title: "Limits Breached", value: "0", trend: { value: "Stable", direction: "flat" as const } },
  { title: "Alerts (24h)", value: "5", trend: { value: "-3 d/d", direction: "down" as const } },
  { title: "VaR (99%)", value: "$14.6M", trend: { value: "+0.8M d/d", direction: "up" as const } },
  { title: "Stress Loss", value: "-$38M", trend: { value: "Scenario: 2020", direction: "down" as const } },
];

const limitBook = [
  { desk: "ETN", type: "Delta", limit: "±$150M", usage: "82%", owner: "Risk" },
  { desk: "Derivatives", type: "Gamma", limit: "±$12M", usage: "64%", owner: "Risk" },
  { desk: "Credit", type: "Spread DV01", limit: "±$4M", usage: "55%", owner: "Ops" },
];

const escalationMatrix = [
  { severity: "Advisory", contact: "Desk Risk", response: "Within 4 hours" },
  { severity: "Watch", contact: "Risk Duty Officer", response: "Immediate" },
  { severity: "Breach", contact: "CRO + COO", response: "Escalate + halt" },
];

export default function RiskControlsPage() {
  return (
    <PageTemplate title="Risk Controls" description="Live limit usage and escalation workflow for the operations desk.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {riskMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limit Inventory</CardTitle>
          <CardDescription>Top monitored risk limits with current utilization.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[28rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Desk</th>
                <th className="py-2 text-left font-medium">Type</th>
                <th className="py-2 text-left font-medium">Limit</th>
                <th className="py-2 text-left font-medium">Usage</th>
                <th className="py-2 text-left font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {limitBook.map((limit) => (
                <tr key={`${limit.desk}-${limit.type}`}>
                  <td className="py-2 font-medium">{limit.desk}</td>
                  <td className="py-2 text-muted-foreground">{limit.type}</td>
                  <td className="py-2 text-muted-foreground">{limit.limit}</td>
                  <td className="py-2 text-muted-foreground">{limit.usage}</td>
                  <td className="py-2">
                    <Badge variant="outline">{limit.owner}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation Matrix</CardTitle>
          <CardDescription>Who to notify when alerts fire.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {escalationMatrix.map((item) => (
              <div key={item.severity} className="rounded-md border bg-muted/40 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{item.severity}</p>
                <p className="mt-2 text-base font-medium">{item.contact}</p>
                <p className="text-sm text-muted-foreground">{item.response}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
