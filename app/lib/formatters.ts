const numberFormatter = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const integerFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

const basisFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  const formatted = value.toFixed(2)
  return `${value > 0 ? "+" : ""}${formatted}`
}

const currencyFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

const timestampFormatter = (value: number | null | undefined) => {
  if (!value) return ""
  return new Date(value).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export {
  basisFormatter,
  currencyFormatter,
  integerFormatter,
  numberFormatter,
  timestampFormatter,
}
