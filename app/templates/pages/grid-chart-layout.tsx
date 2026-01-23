import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

type GridChartLayoutProps = {
  primaryGrid: ReactNode
  secondaryGrid: ReactNode
  chartPanel: ReactNode
  className?: string
}

export function GridChartLayout({
  primaryGrid,
  secondaryGrid,
  chartPanel,
  className,
}: GridChartLayoutProps) {
  return (
    <div className={cn("grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]", className)}>
      <div className="flex min-h-[540px] flex-col gap-3">{primaryGrid}</div>
      <div className="flex min-h-[540px] flex-col gap-3">
        {secondaryGrid}
        {chartPanel}
      </div>
    </div>
  )
}
