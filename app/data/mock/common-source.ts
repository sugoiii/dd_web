import { bookSnapshot } from "../../fixtures/common"
import type { BookSnapshotSource } from "../common-source"

export const mockBookSnapshotSource: BookSnapshotSource = {
  isMock: true,
  fetchSnapshot: async () => bookSnapshot,
  openSocket: () => null,
}
