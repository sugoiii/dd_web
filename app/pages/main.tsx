import { useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

ModuleRegistry.registerModules([AllEnterpriseModule]);

interface IRow {
  name: string;
  value: number;
}

const dashboardMetrics = [
  { title: "Desk P&L", value: "$3.4M", trend: { value: "+$220K d/d", direction: "up" as const } },
  { title: "Risk Utilization", value: "76%", trend: { value: "of limit", direction: "flat" as const } },
  { title: "Capital Deployed", value: "$1.2B", trend: { value: "+4.1% w/w", direction: "up" as const } },
  { title: "Tickets", value: "142", trend: { value: "Past 24h", direction: "up" as const } },
];

const deskUpdates = [
  { title: "Overnight Hedge", detail: "Rolled 1,200 NKY futures to Sep", owner: "ETN" },
  { title: "Liquidity", detail: "Asia close spreads widened 5bps", owner: "Ops" },
  { title: "Product", detail: "Launched beta basket for AI infra", owner: "Strategy" },
];

export default function MainGrid() {
  const [rowData] = useState<IRow[]>([
    { name: "KOSPI2", value: 1313 },
    { name: "SPX", value: 123 },
  ]);
  const [colDefs] = useState<ColDef<IRow>[]>([{ field: "name" }, { field: "value" }]);

  return (
    <PageTemplate title="Desk Dashboard" description="Unified landing page that surfaces live metrics across the stack.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Market Snapshot</CardTitle>
          <CardDescription>Placeholder grid for key instruments the desk tracks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Notes</CardTitle>
          <CardDescription>Quick hits from each squad to review during stand-up.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {deskUpdates.map((update) => (
              <li key={update.title} className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <div>
                  <p className="font-medium">{update.title}</p>
                  <p className="text-sm text-muted-foreground">{update.detail}</p>
                </div>
                <Badge variant="outline">{update.owner}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
