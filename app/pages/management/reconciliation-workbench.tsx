import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const workbenchMetrics = [
  {
    title: "Breaks in Progress",
    value: "6",
    description: "Owned by operations",
    trend: { value: "▼ 2 d/d", direction: "down" as const },
  },
  {
    title: "Awaiting Evidence",
    value: "3",
    description: "Documents pending upload",
    trend: { value: "Requires follow-up", direction: "flat" as const },
  },
  {
    title: "Average Age",
    value: "1.8 days",
    description: "Across open items",
    trend: { value: "Target &lt; 2 days", direction: "flat" as const },
  },
  {
    title: "Closed Today",
    value: "5",
    description: "Breaks moved to reconciled",
    trend: { value: "+2 vs avg", direction: "up" as const },
  },
];

const statusVariant: Record<string, "default" | "outline" | "destructive"> = {
  BREAK: "destructive",
  "IN PROGRESS": "outline",
  PENDING: "outline",
  CLOSED: "default",
};

const breakInventory = [
  {
    id: "CASH-2041",
    scope: "Cash vs Bank",
    desk: "ETN",
    status: "BREAK",
    tolerance: "TIGHT",
    ageing: "2 days",
    owner: "Ops APAC",
    evidence: 1,
  },
  {
    id: "PNL-5510",
    scope: "PnL vs Broker",
    desk: "Global Macro",
    status: "IN PROGRESS",
    tolerance: "STANDARD",
    ageing: "Same day",
    owner: "Prep Team",
    evidence: 2,
  },
  {
    id: "ACC-1183",
    scope: "Accruals vs Actuals",
    desk: "Credit",
    status: "PENDING",
    tolerance: "STANDARD",
    ageing: "5 days",
    owner: "Finance",
    evidence: 0,
  },
];

const reasonCodes = [
  { code: "TIMING", description: "Statement received after cutoff" },
  { code: "BOOKING", description: "Trade captured with incorrect product" },
  { code: "REFERENCE", description: "Counterparty mapping mismatch" },
  { code: "CASH", description: "Bank ledger awaiting approval" },
];

const workflowSteps = [
  {
    step: "Open",
    detail: "Break captured with tolerance profile and owner assigned.",
  },
  {
    step: "In Progress",
    detail: "Preparer uploads reconciliation evidence and commentary.",
  },
  {
    step: "Ready for Review",
    detail: "Preparer marks ready; reviewer receives notification.",
  },
  {
    step: "Closed",
    detail: "Reviewer signs off and break becomes part of audit log.",
  },
];

export default function ReconciliationWorkbenchPage() {
  return (
    <PageTemplate
      title="Reconciliation Workbench"
      description="Break ageing, ownership, and evidence tracking for daily sign-off."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workbenchMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Breaks</CardTitle>
          <CardDescription>Server-side grid will replace this table to scale thousands of rows.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">ID</th>
                <th className="py-2 text-left font-medium">Scope</th>
                <th className="py-2 text-left font-medium">Desk</th>
                <th className="py-2 text-left font-medium">Status</th>
                <th className="py-2 text-left font-medium">Tolerance</th>
                <th className="py-2 text-left font-medium">Ageing</th>
                <th className="py-2 text-left font-medium">Owner</th>
                <th className="py-2 text-left font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {breakInventory.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium">{item.id}</td>
                  <td className="py-2 text-muted-foreground">{item.scope}</td>
                  <td className="py-2 text-muted-foreground">{item.desk}</td>
                  <td className="py-2">
                    <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
                  </td>
                  <td className="py-2 text-muted-foreground">{item.tolerance}</td>
                  <td className="py-2 text-muted-foreground">{item.ageing}</td>
                  <td className="py-2 text-muted-foreground">{item.owner}</td>
                  <td className="py-2 text-muted-foreground">{item.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reason Codes</CardTitle>
          <CardDescription>Standardized taxonomy to explain each break when closing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasonCodes.map((reason) => (
            <div key={reason.code} className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{reason.code}</p>
              <p className="mt-2 text-sm text-muted-foreground">{reason.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Evidence and commentary required at each status transition.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {workflowSteps.map((step) => (
              <li key={step.step} className="rounded-md border bg-muted/40 p-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{step.step}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
