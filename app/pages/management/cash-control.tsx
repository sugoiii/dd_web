import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const cashMetrics = [
  {
    title: "Book Cash",
    value: "$482.3M",
    description: "Asia desks (base CCY)",
    trend: { value: "+$6.4M d/d", direction: "up" as const },
  },
  {
    title: "Bank Balance",
    value: "$476.0M",
    description: "Confirmed via MT940",
    trend: { value: "Refreshed 07:30", direction: "flat" as const },
  },
  {
    title: "Unreconciled Items",
    value: "12",
    description: "> 1 day old",
    trend: { value: "+2 vs target", direction: "up" as const },
  },
  {
    title: "Liquidity Buffer",
    value: "$65M",
    description: "Free cash vs policy",
    trend: { value: "SLA met", direction: "flat" as const },
  },
];

const statusVariant: Record<string, "default" | "outline" | "destructive"> = {
  RECONCILED: "default",
  BREAK: "destructive",
  PENDING: "outline",
};

const cashBreaks = [
  {
    id: "CASH-APAC-01",
    account: "Shinhan 1234",
    currency: "KRW",
    bookCash: "₩182.2B",
    bankCash: "₩182.1B",
    variance: "₩100M",
    status: "PENDING",
    ageing: "1 day",
  },
  {
    id: "CASH-US-08",
    account: "Citi HK 7890",
    currency: "USD",
    bookCash: "$75.4M",
    bankCash: "$74.9M",
    variance: "$0.5M",
    status: "BREAK",
    ageing: "2 days",
  },
  {
    id: "CASH-APAC-11",
    account: "KDB 4567",
    currency: "USD",
    bookCash: "$45.2M",
    bankCash: "$45.2M",
    variance: "$0.0M",
    status: "RECONCILED",
    ageing: "Same day",
  },
];

const ageingBuckets = [
  { bucket: "Same Day", items: 14, exposure: "$6.1M" },
  { bucket: "1-3 Days", items: 7, exposure: "$2.4M" },
  { bucket: ">3 Days", items: 2, exposure: "$0.9M" },
];

const bankFeeds = [
  { bank: "Shinhan", status: "OK", refreshed: "07:32", sla: "Pass" },
  { bank: "Citi", status: "Delayed", refreshed: "06:50", sla: "Warn" },
  { bank: "KDB", status: "OK", refreshed: "07:28", sla: "Pass" },
];

export default function CashControlPage() {
  return (
    <PageTemplate
      title="Cash Control"
      description="Daily book vs bank reconciliation, breaches, and feed health for treasury oversight."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cashMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Breaks</CardTitle>
          <CardDescription>Material variances highlighted using tolerance profile: TIGHT.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[38rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">ID</th>
                <th className="py-2 text-left font-medium">Account</th>
                <th className="py-2 text-left font-medium">CCY</th>
                <th className="py-2 text-left font-medium">Book</th>
                <th className="py-2 text-left font-medium">Bank</th>
                <th className="py-2 text-left font-medium">Variance</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Ageing</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cashBreaks.map((breakItem) => (
                <tr key={breakItem.id}>
                  <td className="py-2 font-medium">{breakItem.id}</td>
                  <td className="py-2 text-muted-foreground">{breakItem.account}</td>
                  <td className="py-2 text-muted-foreground">{breakItem.currency}</td>
                  <td className="py-2 text-muted-foreground">{breakItem.bookCash}</td>
                  <td className="py-2 text-muted-foreground">{breakItem.bankCash}</td>
                  <td className="py-2 text-muted-foreground">{breakItem.variance}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant[breakItem.status] ?? "outline"}>{breakItem.status}</Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{breakItem.ageing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ageing</CardTitle>
          <CardDescription>Helps prioritize review focus for preparers and reviewers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {ageingBuckets.map((bucket) => (
            <div key={bucket.bucket} className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{bucket.bucket}</p>
              <p className="mt-2 text-sm text-muted-foreground">Items: {bucket.items}</p>
              <p className="mt-1 text-base font-medium">Exposure: {bucket.exposure}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Feed Health</CardTitle>
          <CardDescription>Monitoring SLA badges for each provider feed consumed in Seoul (UTC+9).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[24rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Bank</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Last Refresh</th>
                <th className="py-2 text-left font-medium">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bankFeeds.map((feed) => (
                <tr key={feed.bank}>
                  <td className="py-2 font-medium">{feed.bank}</td>
                  <td className="py-2 text-muted-foreground">{feed.status}</td>
                  <td className="py-2 text-muted-foreground">{feed.refreshed}</td>
                  <td className="py-2 text-muted-foreground">{feed.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
