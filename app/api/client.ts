const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
}

export const getApiBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? ""

export const buildRequestHeaders = (token?: string) => ({
  ...DEFAULT_HEADERS,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export const getDelta1BasisWsUrl = () =>
  import.meta.env.VITE_DELTA1_BASIS_WS_URL ?? ""

export const createWebSocket = (url: string) => new WebSocket(url)
