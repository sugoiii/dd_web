export type Delta1SymbolSeed = {
  instrumentId: string
  symbol: string
  book: string
  strategy: string
  baseCash: number
  baseFutures: number
}

export type Delta1FeedSource = {
  isMock: boolean
  openSocket: () => WebSocket | null
  getSymbolSeeds: () => Delta1SymbolSeed[]
}
