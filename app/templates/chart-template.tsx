import type { ReactNode } from "react"
import type { ChartConfig } from "~/components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"
import { AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type ChartTemplateProps<T> = {
  config: ChartConfig
  data: T[]
  xAxisKey: keyof T
  xAxisFormatter?: (value: number | string) => string
  leftAxisFormatter?: (value: number) => string
  rightAxisFormatter?: (value: number) => string
  showRightAxis?: boolean
  className?: string
  children: ReactNode
}

export function ChartTemplate<T>({
  config,
  data,
  xAxisKey,
  xAxisFormatter,
  leftAxisFormatter,
  rightAxisFormatter,
  showRightAxis = false,
  className,
  children,
}: ChartTemplateProps<T>) {
  return (
    <ChartContainer config={config} className={className}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis
          dataKey={xAxisKey as string}
          tickFormatter={xAxisFormatter}
          tick={{ fontSize: 10 }}
        />
        <YAxis
          yAxisId="left"
          tickFormatter={leftAxisFormatter}
          width={46}
          tick={{ fontSize: 10 }}
        />
        {showRightAxis ? (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={rightAxisFormatter}
            width={38}
            tick={{ fontSize: 10 }}
          />
        ) : null}
        <ChartTooltip content={<ChartTooltipContent />} />
        {children}
      </AreaChart>
    </ChartContainer>
  )
}
