import { useMemo, useState } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { format, startOfDay } from "date-fns";

import { type AllocationRow, type LimitRow } from "~/api/common";
import { CommonToolbar } from "~/components/common-toolbar";
import { PageTemplate } from "~/components/page-template";
import { Badge } from "~/components/ui/badge";
import { useCommonSheetRequest } from "~/hooks/request";

import "ag-grid-enterprise/styles/ag-grid.css";
import "ag-grid-enterprise/styles/ag-theme-quartz.css";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    startOfDay(new Date()),
  );
  const [view, setView] = useState("overview");
  const [scope, setScope] = useState("core");
  const asOf = useMemo(
    () => (selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined),
    [selectedDate],
  );

  const {
    allocationRows,
    limitRows,
    isLoading,
    error,
    connectionState,
    refresh,
  } = useCommonSheetRequest({
    view,
    scope,
    asOf,
  });

  const connectionLabel =
    connectionState === "open"
      ? "Live"
      : connectionState === "connecting"
        ? "Connecting"
        : connectionState === "mock"
          ? "Mock"
          : "Offline";

  return (
    <PageTemplate
      title="Common Grid Panels"
      description="Compact, sheet-like overview of allocation drifts and risk limits."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <CommonToolbar
            selectedDate={selectedDate}
            view={view}
            scope={scope}
            onDateChange={setSelectedDate}
            onViewChange={setView}
            onScopeChange={setScope}
            onRefresh={refresh}
            isRefreshing={isLoading}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={isLoading ? "secondary" : "outline"}>
              {isLoading ? "Loading" : "Ready"}
            </Badge>
            <Badge variant={connectionState === "open" ? "default" : "secondary"}>
              Stream: {connectionLabel}
            </Badge>
            {error ? <Badge variant="destructive">Error</Badge> : null}
          </div>
        </div>
      }
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
