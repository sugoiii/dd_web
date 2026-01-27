import {
  fetchSheetSnapshot,
  openSheetSocket,
  type BookSnapshotParams,
} from "../../api/common"
import type { BookSnapshotSource } from "../common-source"

export const realBookSnapshotSource: BookSnapshotSource = {
  isMock: false,
  fetchSnapshot: (params?: BookSnapshotParams) => fetchSheetSnapshot(params),
  openSocket: () => openSheetSocket(),
}
