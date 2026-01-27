import type { BookSnapshot, BookSnapshotParams } from "../api/common"

export type BookSnapshotSource = {
  isMock: boolean
  fetchSnapshot: (params?: BookSnapshotParams) => Promise<BookSnapshot>
  openSocket: () => WebSocket | null
}
