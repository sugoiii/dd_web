import { delta1MockSymbols } from "../../fixtures/delta1"
import type { Delta1FeedSource } from "../delta1-source"

export const mockDelta1FeedSource: Delta1FeedSource = {
  isMock: true,
  openSocket: () => null,
  getSymbolSeeds: () => delta1MockSymbols,
}
