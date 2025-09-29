import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

const preferenceMetrics = [
  { title: "Notifications", value: "9 rules", trend: { value: "3 muted", direction: "flat" as const } },
  { title: "Dashboards", value: "6 layouts", trend: { value: "Shared", direction: "up" as const } },
  { title: "API Tokens", value: "2 active", trend: { value: "Rotate in 12d", direction: "down" as const } },
  { title: "Integrations", value: "Bloomberg + Slack", trend: { value: "Synced", direction: "up" as const } },
];

const workspaceSettings = [
  { name: "Theme", value: "Dark", description: "Applies across all analytics workspaces." },
  { name: "Layout Density", value: "Comfortable", description: "Default grid spacing for tables and cards." },
  { name: "Sidebar", value: "Pinned", description: "Keep navigation visible on desktop." },
];

const notificationRules = [
  { name: "Limit Breach", channel: "Slack #risk-alerts", status: "Active" },
  { name: "Allocation Pending", channel: "Email", status: "Muted" },
  { name: "Overnight Hedge", channel: "Pager", status: "Active" },
];

export default function PreferencesPage() {
  return (
    <PageTemplate title="Preferences" description="A lightweight template for user configuration panels.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {preferenceMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Defaults</CardTitle>
          <CardDescription>Baseline configuration that applies to new dashboards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaceSettings.map((setting) => (
            <div key={setting.name} className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{setting.name}</p>
              <p className="text-base font-medium">{setting.value}</p>
              <p className="text-sm text-muted-foreground">{setting.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>Hook alerts into chat or pager channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationRules.map((rule) => (
            <div key={rule.name} className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <p className="font-medium">{rule.name}</p>
                <p className="text-sm text-muted-foreground">{rule.channel}</p>
              </div>
              <Badge variant={rule.status === "Active" ? "secondary" : "outline"}>{rule.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
