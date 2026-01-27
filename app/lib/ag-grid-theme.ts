import * as React from "react"
import { colorSchemeDark, themeBalham } from "ag-grid-community"

import {
  THEME_CHANGE_EVENT,
  getDocumentTheme,
  isThemeMode,
  type ThemeMode
} from "~/lib/theme"

const lightTheme = themeBalham
const darkTheme = themeBalham.withPart(colorSchemeDark)

export function useAgGridTheme() {
  const [mode, setMode] = React.useState<ThemeMode>(() => getDocumentTheme())

  React.useEffect(() => {
    const handleThemeChange = (event: Event) => {
      if (event instanceof CustomEvent && isThemeMode(event.detail)) {
        setMode(event.detail)
        return
      }

      setMode(getDocumentTheme())
    }

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange)

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange)
    }
  }, [])

  return React.useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode],
  )
}
