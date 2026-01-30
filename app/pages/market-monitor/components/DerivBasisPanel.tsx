import { type ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import { type DerivBasisRow } from "../types";
import { basisFormatter, numberFormatter } from "~/lib/formatters";

type DerivBasisPanelProps = {
  rows: DerivBasisRow[];
  gridTheme: string;
};

const columnDefs: ColDef<DerivBasisRow>[] = [
  { field: "contract", headerName: "Contract", width: 140 },
  { field: "spot", headerName: "Spot", width: 120 },
  { field: "futures", headerName: "Futures", width: 100, valueFormatter: ({ value }) => numberFormatter(value, 2) },
  { field: "fairValue", headerName: "Fair", width: 90, valueFormatter: ({ value }) => numberFormatter(value, 2) },
  { field: "basisBps", headerName: "Basis (bp)", width: 110, valueFormatter: ({ value }) => basisFormatter(value) },
  { field: "expiry", headerName: "Expiry", width: 100 },
];

const getRowId = ({ data }: { data: DerivBasisRow }) => data.contract;

export function DerivBasisPanel({ rows, gridTheme }: DerivBasisPanelProps) {
  return (
    <section className="space-y-2">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Deriv Basis</h2>
        <p className="text-xs text-muted-foreground">Live basis and fair value comparison for listed futures.</p>
      </div>
      <div className="density-compact overflow-hidden rounded-md border">
        <AgGridReact
          rowData={rows}
          columnDefs={columnDefs}
          getRowId={getRowId}
          immutableData
          domLayout="autoHeight"
          theme={gridTheme}
        />
      </div>
    </section>
  );
}
