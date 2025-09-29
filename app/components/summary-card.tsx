import { cn } from "~/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export type SummaryCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: string;
    direction?: "up" | "down" | "flat";
  };
};

export function SummaryCard({ title, value, description, trend }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {description ? <CardDescription className="text-xs text-muted-foreground/80">{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {trend ? <TrendPill trend={trend} /> : null}
      </CardContent>
    </Card>
  );
}

function TrendPill({ trend }: { trend: NonNullable<SummaryCardProps["trend"]> }) {
  const trendClass = cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    trend.direction === "down" && "bg-destructive/10 text-destructive",
    trend.direction === "up" && "bg-emerald-500/10 text-emerald-600",
    (!trend.direction || trend.direction === "flat") && "bg-muted text-muted-foreground"
  );

  return <span className={trendClass}>{trend.value}</span>;
}
