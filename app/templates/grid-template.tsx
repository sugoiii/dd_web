import type { CSSProperties } from "react"
import type { ColDef } from "ag-grid-community"
import type { AgGridReactProps } from "ag-grid-react"
import { AgGridReact } from "ag-grid-react"

import { cn } from "~/lib/utils"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

type GridTemplateProps<T> = Omit<AgGridReactProps<T>, "className"> & {
  className?: string
  containerClassName?: string
  containerStyle?: CSSProperties
  density?: "regular" | "compact"
  rowHeight?: number
  headerHeight?: number
}

const baseDefaultColDef: ColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  cellClass: "text-xs",
  headerClass: "text-[11px] font-semibold",
}

export function GridTemplate<T>({
  className,
  containerClassName,
  containerStyle,
  density = "regular",
  rowHeight,
  headerHeight,
  defaultColDef,
  ...props
}: GridTemplateProps<T>) {
  const resolvedRowHeight = rowHeight ?? (density === "compact" ? 30 : 32)
  const resolvedHeaderHeight = headerHeight ?? (density === "compact" ? 30 : 32)
  const gridStyle = {
    "--ag-row-height": `${resolvedRowHeight}px`,
    "--ag-header-height": `${resolvedHeaderHeight}px`,
    "--ag-font-size": density === "compact" ? "11px" : "12px",
    ...containerStyle,
  } as CSSProperties & Record<string, string>

  return (
    <div
      className={cn(
        "ag-theme-quartz overflow-hidden rounded-lg border bg-background",
        containerClassName,
      )}
      style={gridStyle}
    >
      <AgGridReact<T>
        {...props}
        className={cn("h-full w-full", className)}
        rowHeight={resolvedRowHeight}
        headerHeight={resolvedHeaderHeight}
        defaultColDef={{ ...baseDefaultColDef, ...defaultColDef }}
      />
    </div>
  )
}
