import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const blotterMetrics = [
  { title: "Tickets Today", value: "142", trend: { value: "+18 vs. avg", direction: "up" as const } },
  { title: "Allocations Pending", value: "9", trend: { value: "Requires desk sign-off", direction: "down" as const } },
  { title: "Breaks", value: "2", trend: { value: "Back office queue", direction: "down" as const } },
  { title: "Avg. Fill", value: "98.7%", trend: { value: "of target size", direction: "up" as const } },
];

const trades = [
  { id: "ETN-4821", product: "K200 Mini", side: "Buy", size: "350", price: "324.2", status: "Allocated" },
  { id: "ETF-1974", product: "QQQ", side: "Sell", size: "45k", price: "452.1", status: "Pending" },
  { id: "IDX-9033", product: "Nikkei Futures", side: "Buy", size: "120", price: "38,240", status: "Matched" },
];

const tasks = [
  { title: "Sync with custodian on T+1 settlement", owner: "Ops" },
  { title: "Upload ETF creation files", owner: "Middle" },
  { title: "Review delta hedges for overnight", owner: "Desk" },
];

export default function TradeBlotterPage() {
  return (
    <PageTemplate title="Trade Blotter" description="Operational view of intraday executions and outstanding actions.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {blotterMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Highlights from the past hour across venues.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[28rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Ticket</th>
                <th className="py-2 text-left font-medium">Product</th>
                <th className="py-2 text-left font-medium">Side</th>
                <th className="py-2 text-left font-medium">Size</th>
                <th className="py-2 text-left font-medium">Price</th>
                <th className="py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trades.map((trade) => (
                <tr key={trade.id}>
                  <td className="py-2 font-medium">{trade.id}</td>
                  <td className="py-2 text-muted-foreground">{trade.product}</td>
                  <td className="py-2 text-muted-foreground">{trade.side}</td>
                  <td className="py-2 text-muted-foreground">{trade.size}</td>
                  <td className="py-2 text-muted-foreground">{trade.price}</td>
                  <td className="py-2">
                    <Badge variant="secondary">{trade.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
          <CardDescription>Ops checklist for the close-out process.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {tasks.map((task) => (
              <li key={task.title} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <span>{task.title}</span>
                <Badge variant="outline">{task.owner}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
