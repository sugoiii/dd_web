import { type ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { type TopOfBookRow } from "../types";
import { integerFormatter, numberFormatter, timestampFormatter } from "~/lib/formatters";

type TopOfBookPanelProps = {
  rows: TopOfBookRow[];
  gridTheme: string;
};

const columnDefs: ColDef<TopOfBookRow>[] = [
  { field: "symbol", headerName: "Symbol", width: 120 },
  { field: "venue", headerName: "Venue", width: 90 },
  { field: "bid", headerName: "Bid", width: 90, valueFormatter: ({ value }) => numberFormatter(value, 2) },
  { field: "bidSize", headerName: "Bid Sz", width: 90, valueFormatter: ({ value }) => integerFormatter(value) },
  { field: "ask", headerName: "Ask", width: 90, valueFormatter: ({ value }) => numberFormatter(value, 2) },
  { field: "askSize", headerName: "Ask Sz", width: 90, valueFormatter: ({ value }) => integerFormatter(value) },
  { field: "updatedAt", headerName: "Updated", width: 120, valueFormatter: ({ value }) => timestampFormatter(value) },
];

export function TopOfBookPanel({ rows, gridTheme }: TopOfBookPanelProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top of Book</h2>
        <p className="text-xs text-muted-foreground">Cross-venue price discovery with top quote depth.</p>
      </div>
      <div className="density-compact overflow-hidden rounded-md border">
        <AgGridReact rowData={rows} columnDefs={columnDefs} domLayout="autoHeight" theme={gridTheme} />
      </div>
    </section>
  );
}
