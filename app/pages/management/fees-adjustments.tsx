import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const feeMetrics = [
  {
    title: "Expected Fees",
    value: "$1.8M",
    description: "MTD across funds",
    trend: { value: "+$120K vs plan", direction: "up" as const },
  },
  {
    title: "Billed",
    value: "$1.4M",
    description: "Invoices received",
    trend: { value: "3 vendors outstanding", direction: "flat" as const },
  },
  {
    title: "Applied",
    value: "$1.2M",
    description: "Booked to PnL",
    trend: { value: "Catch up 2 breaks", direction: "up" as const },
  },
  {
    title: "Adjustments",
    value: "$240K",
    description: "Pending approval",
    trend: { value: "High impact", direction: "flat" as const },
  },
];

const statusVariant: Record<string, "default" | "outline" | "destructive"> = {
  RECONCILED: "default",
  BREAK: "destructive",
  PENDING: "outline",
};

const feeSchedule = [
  {
    counterparty: "Prime Broker A",
    feeType: "Financing",
    expected: "$420K",
    billed: "$400K",
    applied: "$400K",
    variance: "-$20K",
    status: "RECONCILED",
    evidence: 3,
  },
  {
    counterparty: "Custodian B",
    feeType: "Safekeeping",
    expected: "$180K",
    billed: "$0",
    applied: "$0",
    variance: "-$180K",
    status: "BREAK",
    evidence: 0,
  },
  {
    counterparty: "Legal Advisory",
    feeType: "Advisory",
    expected: "$90K",
    billed: "$50K",
    applied: "$0",
    variance: "-$40K",
    status: "PENDING",
    evidence: 1,
  },
];

const upcomingCharges = [
  { contract: "Swap Clearing", start: "Aug 12", amount: "$210K", owner: "Ops" },
  { contract: "Audit Retainer", start: "Aug 25", amount: "$85K", owner: "Finance" },
  { contract: "Data Vendor", start: "Sep 01", amount: "$120K", owner: "Research" },
];

const approvalTrail = [
  {
    id: "ADJ-771",
    description: "Rebate true-up for K200 futures roll",
    submitted: "Preparer: 07:15",
    reviewer: "Awaiting Ops Head",
    status: "PENDING",
  },
  {
    id: "ADJ-758",
    description: "Withholding tax gross-up",
    submitted: "Preparer: 06:40",
    reviewer: "Approved 07:20",
    status: "RECONCILED",
  },
];

export default function FeesAdjustmentsPage() {
  return (
    <PageTemplate
      title="Fees & Adjustments"
      description="Visibility into expected vs billed vs applied along with workflow evidence."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {feeMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Schedule</CardTitle>
          <CardDescription>Contracted amounts compared to billing status in base CCY.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[40rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Counterparty</th>
                <th className="py-2 text-left font-medium">Type</th>
                <th className="py-2 text-left font-medium">Expected</th>
                <th className="py-2 text-left font-medium">Billed</th>
                <th className="py-2 text-left font-medium">Applied</th>
                <th className="py-2 text-left font-medium">Variance</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {feeSchedule.map((fee) => (
                <tr key={fee.counterparty}>
                  <td className="py-2 font-medium">{fee.counterparty}</td>
                  <td className="py-2 text-muted-foreground">{fee.feeType}</td>
                  <td className="py-2 text-muted-foreground">{fee.expected}</td>
                  <td className="py-2 text-muted-foreground">{fee.billed}</td>
                  <td className="py-2 text-muted-foreground">{fee.applied}</td>
                  <td className="py-2 text-muted-foreground">{fee.variance}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant[fee.status] ?? "outline"}>{fee.status}</Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{fee.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Charges</CardTitle>
          <CardDescription>Expected accruals sourced from fee schedules.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {upcomingCharges.map((charge) => (
              <li key={charge.contract} className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-semibold">{charge.contract}</p>
                  <p className="text-xs text-muted-foreground">Go-live: {charge.start}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{charge.amount}</p>
                  <p>Owner: {charge.owner}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adjustment Approvals</CardTitle>
          <CardDescription>Workflow evidence for overrides and accrual adjustments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvalTrail.map((item) => (
            <div key={item.id} className="rounded-md border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{item.id}</p>
                <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.submitted}</p>
              <p className="text-xs text-muted-foreground">{item.reviewer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
