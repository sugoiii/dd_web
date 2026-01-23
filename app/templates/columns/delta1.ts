import type { ColDef, ColGroupDef } from "ag-grid-community"

import {
  createBasisColumn,
  createCurrencyColumn,
  createIntegerColumn,
  createNumberColumn,
  createTimestampColumn,
  instrumentColumn,
} from "~/templates/columns/common"

export type Delta1ColumnSetKey = "core" | "liquidity"

export const delta1ColumnSets: Record<Delta1ColumnSetKey, (ColDef | ColGroupDef)[]> = {
  core: [
    instrumentColumn,
    {
      headerName: "Cash Leg",
      marryChildren: true,
      children: [
        createNumberColumn("Bid", "cashBid", 4),
        createNumberColumn("Ask", "cashAsk", 4),
        createNumberColumn("Mid", "cashMid", 4),
      ],
    },
    {
      headerName: "Futures Leg",
      marryChildren: true,
      children: [
        createNumberColumn("Bid", "futuresBid", 4),
        createNumberColumn("Ask", "futuresAsk", 4),
        createNumberColumn("Mid", "futuresMid", 4),
      ],
    },
    {
      headerName: "Derived Metrics",
      marryChildren: true,
      children: [
        createBasisColumn("Basis (bps)", "basisBps"),
        createBasisColumn("Theo Edge (bps)", "theoreticalEdgeBps"),
        createIntegerColumn("Net Position", "netPosition"),
        createCurrencyColumn("Carry P&L", "carryPnL"),
        {
          headerName: "Hedge Suggestion",
          field: "hedgeSuggestion",
        },
        createNumberColumn("Predicted Hedge Fill", "predictedHedgeFill", 4),
      ],
    },
    {
      headerName: "Timestamps",
      children: [
        createTimestampColumn("Quote", "lastQuoteTimestamp"),
        createTimestampColumn("Trade", "lastTradeTimestamp"),
      ],
    },
  ],
  liquidity: [
    instrumentColumn,
    {
      headerName: "Execution",
      marryChildren: true,
      children: [
        createNumberColumn("Cash Bid", "cashBid", 4),
        createNumberColumn("Futures Ask", "futuresAsk", 4),
        createNumberColumn("Theo Futures", "theoreticalFutures", 4),
        createBasisColumn("Theo Basis", "theoreticalBasisBps"),
        createCurrencyColumn("Carry Daily", "carryDaily"),
        createTimestampColumn("Updated", "lastUpdated"),
      ],
    },
  ],
}
