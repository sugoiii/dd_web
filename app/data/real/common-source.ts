import {
  fetchSheetSnapshot,
  openSheetSocket,
  type SheetSnapshotParams,
} from "../../api/common"
import type { CommonSheetSource } from "../common-source"

export const realCommonSheetSource: CommonSheetSource = {
  isMock: false,
  fetchSnapshot: (params?: SheetSnapshotParams) => fetchSheetSnapshot(params),
  openSocket: () => openSheetSocket(),
}
