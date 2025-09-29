import { useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

ModuleRegistry.registerModules([AllEnterpriseModule]);

interface IRow {
  name: string;
  value: number;
}

const realtimeMetrics = [
  { title: "Quote Latency", value: "118 ms", trend: { value: "< 150 ms budget", direction: "up" as const } },
  { title: "Alerts", value: "3", trend: { value: "Triggered today", direction: "down" as const } },
  { title: "Liquidity Score", value: "8.4 / 10", trend: { value: "Composite", direction: "up" as const } },
  { title: "Heartbeat", value: "OK", trend: { value: "All feeds", direction: "flat" as const } },
];

export default function EtnRealtime() {
  const [rowData] = useState<IRow[]>([
    { name: "KOSPI2", value: 1423 },
    { name: "SPX", value: 1423 },
  ]);
  const [colDefs] = useState<ColDef<IRow>[]>([{ field: "name" }, { field: "value" }]);

  return (
    <PageTemplate title="Realtime Monitor" description="Live market feed placeholders with alerting hooks.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {realtimeMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Streaming Prices</CardTitle>
          <CardDescription>Swap in websockets or polling logic for production feeds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Log</CardTitle>
          <CardDescription>Placeholder grid for triggered alerts and acknowledgements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" />
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
