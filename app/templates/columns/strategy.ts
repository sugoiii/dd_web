import type { ColDef, ColGroupDef, ICellRendererParams } from "ag-grid-community"

import {
  createCurrencyColumn,
  createIntegerColumn,
  createNumberColumn,
  createTimestampColumn,
} from "~/templates/columns/common"
import { timestampFormatter } from "~/lib/formatters"

type AutoHedgeRenderer = (
  params: ICellRendererParams<unknown, boolean> & {
    onToggle: (id: string, next: boolean) => void
  },
) => JSX.Element

type PositionColumnOptions = {
  onAutoHedgeToggle: (id: string, next: boolean) => void
  autoHedgeRenderer: AutoHedgeRenderer
}

export const createPositionColumnDefs = (
  options: PositionColumnOptions,
): (ColDef | ColGroupDef)[] => [
  { field: "book", rowGroup: true, hide: true },
  { field: "strategy", rowGroup: true, hide: true },
  {
    headerName: "Symbol",
    field: "symbol",
    pinned: "left",
    minWidth: 120,
  },
  {
    ...createIntegerColumn("Cash Pos", "cashPosition"),
    aggFunc: "sum",
  },
  {
    ...createIntegerColumn("Futures Pos", "futuresPosition"),
    aggFunc: "sum",
  },
  {
    ...createIntegerColumn("Net Δ", "netDelta"),
    aggFunc: "sum",
  },
  {
    ...createCurrencyColumn("Carry Decay", "carryDecay"),
    aggFunc: "avg",
  },
  {
    headerName: "Auto Hedge",
    field: "autoHedge",
    cellRenderer: options.autoHedgeRenderer,
    cellRendererParams: {
      onToggle: options.onAutoHedgeToggle,
    },
  },
  createTimestampColumn("Updated", "lastUpdated"),
]

export const createTapeColumnDefs = (): (ColDef | ColGroupDef)[] => [
  {
    headerName: "Time",
    field: "timestamp",
    valueFormatter: ({ value }) => timestampFormatter(value),
    minWidth: 110,
  },
  {
    headerName: "Type",
    field: "type",
    width: 90,
    cellClass: "capitalize",
  },
  {
    headerName: "Symbol",
    field: "symbol",
    minWidth: 120,
  },
  {
    headerName: "Leg",
    field: "leg",
    width: 90,
    cellClass: "capitalize",
  },
  {
    headerName: "Side",
    field: "side",
    width: 90,
    cellClass: "capitalize",
  },
  createIntegerColumn("Size", "size"),
  createNumberColumn("Price", "price", 4),
  {
    headerName: "Event",
    field: "message",
    flex: 1,
  },
]
