import type { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { PageTemplate } from "~/components/page-template";

import "ag-grid-enterprise/styles/ag-grid.css";
import "ag-grid-enterprise/styles/ag-theme-quartz.css";

type AllocationRow = {
  sleeve: string;
  target: string;
  actual: string;
  drift: string;
};

type LimitRow = {
  limit: string;
  value: string;
  status: string;
};

const allocationRows: AllocationRow[] = [
  { sleeve: "Core", target: "45%", actual: "44%", drift: "-1%" },
  { sleeve: "Tactical", target: "25%", actual: "27%", drift: "+2%" },
  { sleeve: "Hedge", target: "15%", actual: "14%", drift: "-1%" },
  { sleeve: "Cash", target: "15%", actual: "15%", drift: "0%" },
];

const limitRows: LimitRow[] = [
  { limit: "Gross Notional", value: "$1.2B", status: "Within" },
  { limit: "Net Delta", value: "$85M", status: "Tight" },
  { limit: "VaR (99%)", value: "$5.4M", status: "Within" },
];

const allocationColumns: ColDef<AllocationRow>[] = [
  { field: "sleeve", headerName: "Sleeve" },
  { field: "target", headerName: "Target" },
  { field: "actual", headerName: "Actual" },
  { field: "drift", headerName: "Drift" },
];

const limitColumns: ColDef<LimitRow>[] = [
  { field: "limit", headerName: "Limit" },
  { field: "value", headerName: "Value" },
  { field: "status", headerName: "Status" },
];

export default function CommonOverview() {
  return (
    <PageTemplate
      title="Common Grid Panels"
      description="Compact, sheet-like overview of allocation drifts and risk limits."
    >
      <div className="grid gap-3 xl:grid-cols-2">
        <section className="space-y-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Allocation Drift
            </h2>
            <p className="text-xs text-muted-foreground">
              Simple sleeves and target drift summary for the morning check.
            </p>
          </div>
          <div className="ag-theme-quartz density-compact overflow-hidden rounded-md border">
            <AgGridReact
              rowData={allocationRows}
              columnDefs={allocationColumns}
              domLayout="autoHeight"
            />
          </div>
        </section>

        <section className="space-y-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Risk Limits
            </h2>
            <p className="text-xs text-muted-foreground">
              Tight view of current limits with minimal chrome.
            </p>
          </div>
          <div className="ag-theme-quartz density-compact overflow-hidden rounded-md border">
            <AgGridReact rowData={limitRows} columnDefs={limitColumns} domLayout="autoHeight" />
          </div>
        </section>
      </div>
    </PageTemplate>
  );
}
