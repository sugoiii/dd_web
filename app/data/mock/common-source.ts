import { commonSheetSnapshot } from "../../fixtures/common"
import type { CommonSheetSource } from "../common-source"

export const mockCommonSheetSource: CommonSheetSource = {
  isMock: true,
  fetchSnapshot: async () => commonSheetSnapshot,
  openSocket: () => null,
}
