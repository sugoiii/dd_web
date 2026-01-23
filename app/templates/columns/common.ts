import type { ColDef } from "ag-grid-community"

import {
  basisFormatter,
  currencyFormatter,
  integerFormatter,
  numberFormatter,
  timestampFormatter,
} from "~/lib/formatters"

export const instrumentColumn: ColDef = {
  headerName: "Instrument",
  field: "symbol",
  pinned: "left",
  minWidth: 120,
  cellClass: "font-semibold",
}

export const createNumberColumn = (headerName: string, field: string, digits = 2): ColDef => ({
  headerName,
  field,
  type: "rightAligned",
  valueFormatter: ({ value }) => numberFormatter(value, digits),
})

export const createIntegerColumn = (headerName: string, field: string): ColDef => ({
  headerName,
  field,
  type: "rightAligned",
  valueFormatter: ({ value }) => integerFormatter(value),
})

export const createBasisColumn = (headerName: string, field: string): ColDef => ({
  headerName,
  field,
  type: "rightAligned",
  valueFormatter: ({ value }) => basisFormatter(value),
})

export const createCurrencyColumn = (headerName: string, field: string): ColDef => ({
  headerName,
  field,
  type: "rightAligned",
  valueFormatter: ({ value }) => currencyFormatter(value),
})

export const createTimestampColumn = (headerName: string, field: string): ColDef => ({
  headerName,
  field,
  valueFormatter: ({ value }) => timestampFormatter(value),
})
