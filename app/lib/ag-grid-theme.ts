import * as React from "react"
import { colorSchemeDark, themeQuartz } from "ag-grid-community"

import {
  THEME_CHANGE_EVENT,
  getDocumentTheme,
  isThemeMode,
} from "~/lib/theme"
import type { ThemeMode } from "~/lib/theme"

const lightTheme = themeQuartz
const darkTheme = themeQuartz.withPart(colorSchemeDark)

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
