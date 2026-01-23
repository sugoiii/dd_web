import { useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useAgGridTheme } from "~/lib/ag-grid-theme";

interface IRow {
  name: string;
  value: number;
}

const etnMetrics = [
  { title: "Exposure", value: "$540M", trend: { value: "+$18M d/d", direction: "up" as const } },
  { title: "Hedge Ratio", value: "97.4%", trend: { value: "-0.3% d/d", direction: "down" as const } },
  { title: "Subscriptions", value: "$12.5M", trend: { value: "+1.2M", direction: "up" as const } },
  { title: "Redemptions", value: "$4.1M", trend: { value: "Inline", direction: "flat" as const } },
];

export default function EtnMain() {
  const gridTheme = useAgGridTheme();
  const [rowData] = useState<IRow[]>([
    { name: "KOSPI2", value: 1423 },
    { name: "SPX", value: 1423 },
  ]);
  const [colDefs] = useState<ColDef<IRow>[]>([{ field: "name" }, { field: "value" }]);

  return (
    <PageTemplate title="ETN Overview" description="Landing spot for fund exposures, hedges, and subscription flow.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {etnMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exposure by Underlying</CardTitle>
          <CardDescription>Use this section to plug in live position data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" theme={gridTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hedge Coverage</CardTitle>
          <CardDescription>Second grid reserved for delta/vega hedging views.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" theme={gridTheme} />
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
