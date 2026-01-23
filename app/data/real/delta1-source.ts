import { openDelta1BasisSocket } from "../../api/delta1"
import type { Delta1FeedSource } from "../delta1-source"

export const realDelta1FeedSource: Delta1FeedSource = {
  isMock: false,
  openSocket: () => openDelta1BasisSocket(),
  getSymbolSeeds: () => [],
}
