import { useEffect, useRef } from "react";
import type { ColDef, GridApi, GridReadyEvent, RowDataTransaction } from "ag-grid-enterprise";
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

const getRowId = ({ data }: { data: TopOfBookRow }) => data.symbol;

export function TopOfBookPanel({ rows, gridTheme }: TopOfBookPanelProps) {
  const gridApiRef = useRef<GridApi<TopOfBookRow> | null>(null);
  const rowsRef = useRef<TopOfBookRow[]>([]);

  const handleGridReady = (event: GridReadyEvent<TopOfBookRow>) => {
    gridApiRef.current = event.api;
    event.api.setRowData(rows);
    rowsRef.current = rows;
  };

  useEffect(() => {
    const gridApi = gridApiRef.current;
    if (!gridApi) {
      return;
    }

    const previousRows = rowsRef.current;
    const previousMap = new Map(previousRows.map((row) => [row.symbol, row]));
    const nextMap = new Map(rows.map((row) => [row.symbol, row]));

    const updates: TopOfBookRow[] = [];
    const adds: TopOfBookRow[] = [];
    const removes: TopOfBookRow[] = [];

    rows.forEach((row) => {
      if (previousMap.has(row.symbol)) {
        updates.push(row);
      } else {
        adds.push(row);
      }
    });

    previousRows.forEach((row) => {
      if (!nextMap.has(row.symbol)) {
        removes.push(row);
      }
    });

    const transaction: RowDataTransaction<TopOfBookRow> = {};
    if (updates.length) {
      transaction.update = updates;
    }
    if (adds.length) {
      transaction.add = adds;
    }
    if (removes.length) {
      transaction.remove = removes;
    }

    if (transaction.add || transaction.update || transaction.remove) {
      gridApi.applyTransaction(transaction);
    }
    rowsRef.current = rows;
  }, [rows]);

  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top of Book</h2>
        <p className="text-xs text-muted-foreground">Cross-venue price discovery with top quote depth.</p>
      </div>
      <div className="density-compact overflow-hidden rounded-md border">
        <AgGridReact
          columnDefs={columnDefs}
          getRowId={getRowId}
          immutableData
          onGridReady={handleGridReady}
          domLayout="autoHeight"
          theme={gridTheme}
        />
      </div>
    </section>
  );
}
