import type { SheetSnapshot, SheetSnapshotParams } from "../api/common"

export type CommonSheetSource = {
  isMock: boolean
  fetchSnapshot: (params?: SheetSnapshotParams) => Promise<SheetSnapshot>
  openSocket: () => WebSocket | null
}
