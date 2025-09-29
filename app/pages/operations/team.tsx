import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const teamMetrics = [
  { title: "Active Users", value: "42", trend: { value: "+3 w/w", direction: "up" as const } },
  { title: "Pending Access", value: "5", trend: { value: "Awaiting approval", direction: "flat" as const } },
  { title: "Coverage Today", value: "Seoul + NY", trend: { value: "Follow the sun", direction: "flat" as const } },
  { title: "Training Due", value: "4", trend: { value: "Renew within 7d", direction: "down" as const } },
];

const roster = [
  { name: "Jieun Lee", role: "ETN Trader", shift: "Asia", status: "On desk" },
  { name: "Mark Rivera", role: "Ops Lead", shift: "US", status: "Remote" },
  { name: "Priya Nataraj", role: "Quant", shift: "Europe", status: "Travel" },
];

const approvals = [
  { request: "Add OMS admin rights", owner: "Ops", due: "Today" },
  { request: "Enable research workspace", owner: "Tech", due: "Tomorrow" },
];

export default function TeamManagementPage() {
  return (
    <PageTemplate title="Team Management" description="Track coverage, pending requests, and compliance tasks.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {teamMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Desk Coverage</CardTitle>
          <CardDescription>Today's staffing overview by region.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.map((member) => (
            <div key={member.name} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
              <div>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{member.shift}</Badge>
                <Badge variant="secondary">{member.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Requests that require desk sign-off.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {approvals.map((item) => (
              <li key={item.request} className="flex items-center justify-between rounded-md border bg-card p-3">
                <span>{item.request}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.owner}</Badge>
                  <Badge variant="secondary">Due {item.due}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
