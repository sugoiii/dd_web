import { useMemo, useState } from "react";
import { type ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { startOfDay } from "date-fns";
import { RefreshCw } from "lucide-react";

import { type PriceRow, type PositionRow } from "~/api/common";
import { type ToolbarItem, CommonToolbar } from "~/components/common-toolbar";
import { PageTemplate } from "~/components/page-template";
import { Badge } from "~/components/ui/badge";
import { useBookSnapshotRequest } from "~/hooks/request";
import { useAgGridTheme } from "~/lib/ag-grid-theme";

import { integerFormatter } from "~/lib/formatters";

const VIEW_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "stress", label: "Stress" },
];

const SCOPE_OPTIONS = [
  { value: "core", label: "Core sleeves" },
  { value: "extended", label: "Extended" },
];

const priceColumnDefs: ColDef<PriceRow>[] = [
  { field: "symbol", headerName: "Symbol", width: 100 },
  { field: "name", headerName: "Name", width: 100 },
  { field: "type", headerName: "Type", width: 100 },
  { field: "price", headerName: "Price", width: 100, valueFormatter: ({ value }) => integerFormatter(value) },
  { field: "price_theo", headerName: "Price (Theo)", width: 120, valueFormatter: ({ value }) => integerFormatter(value) },
  { field: "dividend", headerName: "Dividend", width: 100, valueFormatter: ({ value }) => integerFormatter(value) },
];

const positionColumnDefs: ColDef<PositionRow>[] = [
  { field: "symbol", headerName: "Limit" },
  { field: "name", headerName: "Value" },
  { field: "type", headerName: "Status" },
  { field: "quantity", headerName: "Status" },
  { field: "price", headerName: "Status" },
  { field: "amount", headerName: "Status" },
];

export default function CommonOverview() {
  const gridTheme = useAgGridTheme();
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(() => startOfDay(new Date()));
  const [view, setView] = useState("overview");
  const [scope, setScope] = useState("core");
  const fund = "9999";

  const { priceRows, positionRows, isLoading, error, connectionState, refresh } = useBookSnapshotRequest({
    asOfDate,
    fund,
  });

  const connectionLabel = connectionState === "open" ? "Live" : connectionState === "connecting" ? "Connecting" : connectionState === "mock" ? "Mock" : "Offline";
  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      {
        id: "as-of-date",
        type: "date",
        value: asOfDate,
        onChange: setAsOfDate,
        placeholder: "Pick a date",
      },
      {
        id: "view",
        type: "select",
        value: view,
        onChange: setView,
        options: VIEW_OPTIONS,
        placeholder: "View",
        size: "sm",
        triggerClassName: "min-w-[150px]",
      },
      {
        id: "scope",
        type: "select",
        value: scope,
        onChange: setScope,
        options: SCOPE_OPTIONS,
        placeholder: "Scope",
        size: "sm",
        triggerClassName: "min-w-[160px]",
      },
      {
        id: "refresh",
        type: "action",
        label: "Refresh",
        icon: RefreshCw,
        onClick: refresh,
        isLoading,
        variant: "secondary",
        size: "sm",
      },
    ],
    [asOfDate, isLoading, refresh, scope, view],
  );

  return (
    <PageTemplate
      title="Template"
      description="Compact, sheet-like overview of allocation drifts and risk limits."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <CommonToolbar items={toolbarItems} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={isLoading ? "secondary" : "outline"}>{isLoading ? "Loading" : "Ready"}</Badge>
            <Badge variant={connectionState === "open" ? "default" : "secondary"}>Stream: {connectionLabel}</Badge>
            {error ? <Badge variant="destructive">Error</Badge> : null}
          </div>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-5">
        <section className="space-y-2 xl:col-span-2">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Allocation Drift</h2>
            <p className="text-xs text-muted-foreground">Simple sleeves and target drift summary for the morning check.</p>
          </div>
          <div className="density-compact overflow-hidden rounded-md border">
            <AgGridReact rowData={priceRows} columnDefs={priceColumnDefs} domLayout="autoHeight" theme={gridTheme} />
          </div>
        </section>

        <section className="space-y-2 xl:col-span-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Risk Limits</h2>
            <p className="text-xs text-muted-foreground">Tight view of current limits with minimal chrome.</p>
          </div>
          <div className="density-compact overflow-hidden rounded-md border">
            <AgGridReact rowData={positionRows} columnDefs={positionColumnDefs} domLayout="autoHeight" theme={gridTheme} />
          </div>
        </section>
      </div>
    </PageTemplate>
  );
}
