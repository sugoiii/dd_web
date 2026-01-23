export type ThemeMode = "light" | "dark"

export const THEME_STORAGE_KEY = "desk-design:theme"
export const THEME_CHANGE_EVENT = "desk-theme-change"

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "dark"
}

export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeMode(stored) ? stored : null
}

export function getDocumentTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "light"
  }

  const attrTheme = document.documentElement.dataset.theme
  if (isThemeMode(attrTheme)) {
    return attrTheme
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === "undefined") {
    return
  }

  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme === "dark" ? "dark" : "light"
  root.dataset.theme = theme
}

export function storeTheme(theme: ThemeMode) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}
