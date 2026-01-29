import { type ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { type PositionRow } from "../types";
import { currencyFormatter, integerFormatter, numberFormatter } from "~/lib/formatters";

type PositionsPanelProps = {
  rows: PositionRow[];
  gridTheme: string;
};

const percentFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }

  return `${numberFormatter(value * 100, 0)}%`;
};

const columnDefs: ColDef<PositionRow>[] = [
  { field: "strategy", headerName: "Strategy", width: 140 },
  { field: "symbol", headerName: "Symbol", width: 110 },
  { field: "net", headerName: "Net", width: 80, valueFormatter: ({ value }) => integerFormatter(value) },
  { field: "avgPx", headerName: "Avg Px", width: 90, valueFormatter: ({ value }) => numberFormatter(value, 2) },
  { field: "unrealizedPnl", headerName: "Unrl P&L", width: 120, valueFormatter: ({ value }) => currencyFormatter(value) },
  { field: "limitUtilization", headerName: "Utilization", width: 110, valueFormatter: ({ value }) => percentFormatter(value) },
];

export function PositionsPanel({ rows, gridTheme }: PositionsPanelProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Positions</h2>
        <p className="text-xs text-muted-foreground">Net exposures and utilization against intraday limits.</p>
      </div>
      <div className="density-compact overflow-hidden rounded-md border">
        <AgGridReact rowData={rows} columnDefs={columnDefs} domLayout="autoHeight" theme={gridTheme} />
      </div>
    </section>
  );
}
