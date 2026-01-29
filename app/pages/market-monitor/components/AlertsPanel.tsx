import { type ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { type AlertRow } from "../types";
import { timestampFormatter } from "~/lib/formatters";

type AlertsPanelProps = {
  rows: AlertRow[];
  gridTheme: string;
};

const columnDefs: ColDef<AlertRow>[] = [
  { field: "time", headerName: "Time", width: 110, valueFormatter: ({ value }) => timestampFormatter(value) },
  { field: "level", headerName: "Level", width: 90 },
  { field: "message", headerName: "Message", minWidth: 240, flex: 1 },
  { field: "source", headerName: "Source", width: 110 },
  { field: "status", headerName: "Status", width: 110 },
];

export function AlertsPanel({ rows, gridTheme }: AlertsPanelProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Alerts</h2>
        <p className="text-xs text-muted-foreground">Streaming guardrails and operator triage queue.</p>
      </div>
      <div className="density-compact overflow-hidden rounded-md border">
        <AgGridReact rowData={rows} columnDefs={columnDefs} domLayout="autoHeight" theme={gridTheme} />
      </div>
    </section>
  );
}
