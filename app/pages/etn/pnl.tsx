import { useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface IRow {
  name: string;
  value: number;
}

const pnlMetrics = [
  { title: "Daily P&L", value: "$420K", trend: { value: "+$65K vs. plan", direction: "up" as const } },
  { title: "MTD", value: "$6.8M", trend: { value: "+12%", direction: "up" as const } },
  { title: "Hit Rate", value: "62%", trend: { value: "Last 20 days", direction: "up" as const } },
  { title: "Slippage", value: "-3.2 bps", trend: { value: "vs. benchmark", direction: "down" as const } },
];

export default function EtnPnl() {
  const [rowData] = useState<IRow[]>([
    { name: "KOSPI2", value: 1423 },
    { name: "SPX", value: 1423 },
  ]);
  const [colDefs] = useState<ColDef<IRow>[]>([{ field: "name" }, { field: "value" }]);

  return (
    <PageTemplate title="ETN P&L" description="Template for attribution, scenario analysis, and slippage breakdowns.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pnlMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attribution Grid</CardTitle>
          <CardDescription>Swap in portfolio contributions by factor, ticker, or strategy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <AgGridReact rowData={rowData} columnDefs={colDefs} domLayout="autoHeight" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Planner</CardTitle>
          <CardDescription>Placeholder for what-if shocks and risk projections.</CardDescription>
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
