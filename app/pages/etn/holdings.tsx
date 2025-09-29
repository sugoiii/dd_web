import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const holdingsSummary = [
  { title: "Total AUM", value: "$842M", trend: { value: "+3.2% vs. LY", direction: "up" as const } },
  { title: "Cash Buffer", value: "$26.4M", trend: { value: "Target 30M", direction: "flat" as const } },
  { title: "Hedge Ratio", value: "97.4%", trend: { value: "-0.3% d/d", direction: "down" as const } },
  { title: "Next Rebalance", value: "Jun 14", trend: { value: "+4 days", direction: "up" as const } },
];

const topHoldings = [
  { symbol: "NVDA", name: "NVIDIA Corp.", weight: "12.4%", delta: "+45 bps", status: "Overweight" },
  { symbol: "MSFT", name: "Microsoft Corp.", weight: "9.8%", delta: "+12 bps", status: "Neutral" },
  { symbol: "AAPL", name: "Apple Inc.", weight: "7.6%", delta: "-18 bps", status: "Trim" },
  { symbol: "SOXX", name: "iShares Semis ETF", weight: "6.1%", delta: "+5 bps", status: "Hedge" },
];

const rebalanceActions = [
  { action: "Reduce", symbol: "AAPL", reason: "Earnings vol", owner: "J. Kim" },
  { action: "Increase", symbol: "NVDA", reason: "Flow driven", owner: "M. Park" },
  { action: "Monitor", symbol: "SOXX", reason: "Carry drift", owner: "Desk" },
];

export default function EtnHoldingsPage() {
  return (
    <PageTemplate title="ETN Holdings" description="Review constituent weights, hedges, and planned adjustments.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {holdingsSummary.map((item) => (
          <SummaryCard key={item.title} {...item} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Constituents</CardTitle>
          <CardDescription>Intraday estimated weights versus target allocation.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[32rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Symbol</th>
                <th className="py-2 text-left font-medium">Name</th>
                <th className="py-2 text-right font-medium">Weight</th>
                <th className="py-2 text-right font-medium">Δ vs. target</th>
                <th className="py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topHoldings.map((holding) => (
                <tr key={holding.symbol}>
                  <td className="py-2 font-medium">{holding.symbol}</td>
                  <td className="py-2 text-muted-foreground">{holding.name}</td>
                  <td className="py-2 text-right">{holding.weight}</td>
                  <td className="py-2 text-right">{holding.delta}</td>
                  <td className="py-2">
                    <Badge variant="secondary">{holding.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rebalance Prep</CardTitle>
          <CardDescription>Action items to complete before the next scheduled rebalance.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {rebalanceActions.map((task) => (
              <li key={`${task.action}-${task.symbol}`} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">
                    {task.action} {task.symbol}
                  </p>
                  <p className="text-sm text-muted-foreground">{task.reason}</p>
                </div>
                <Badge variant="outline">{task.owner}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
