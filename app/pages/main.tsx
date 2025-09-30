import { useMemo } from "react";
import type { MetaDescriptor } from "react-router";
import { Link } from "react-router";
import { ArrowUpRight, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { format, startOfDay } from "date-fns";

import { PageTemplate } from "~/components/page-template";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "~/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export function meta(): MetaDescriptor[] {
  return [
    { title: "Desk Dashboard" },
    {
      name: "description",
      content:
        "Landing hub with the global holiday calendar, intraday P&L, and quick access links.",
    },
  ];
}

type HolidaySeed = {
  month: number;
  day: number;
  label: string;
  region: string;
  impact: "Closed" | "Partial";
};

const HOLIDAY_SEEDS: HolidaySeed[] = [
  { month: 0, day: 1, label: "New Year's Day", region: "Global", impact: "Closed" },
  { month: 1, day: 17, label: "Lunar New Year", region: "Asia", impact: "Partial" },
  { month: 4, day: 1, label: "Labor Day", region: "EMEA + APAC", impact: "Closed" },
  { month: 6, day: 4, label: "Independence Day", region: "US", impact: "Partial" },
  { month: 8, day: 16, label: "Mid-Autumn Festival", region: "Asia", impact: "Partial" },
  { month: 11, day: 25, label: "Christmas Day", region: "Global", impact: "Closed" },
];

const departmentPnls = [
  { department: "Index Arbitrage", pnl: 1.38, planVariance: 0.24 },
  { department: "Systematic Macro", pnl: -0.42, planVariance: -0.15 },
  { department: "Options Desk", pnl: 0.86, planVariance: 0.12 },
  { department: "Credit Relative Value", pnl: 0.31, planVariance: -0.02 },
  { department: "Digital Assets", pnl: 0.18, planVariance: 0.04 },
];

const usefulLinks = [
  {
    title: "Management Oversight Dashboard",
    href: "/management",
    description: "Morning certification view of reconciliation status across desks.",
  },
  {
    title: "ETN Intraday P&L",
    href: "/etn/pnl",
    description: "Attribution drill-down for structured product flows and hedges.",
  },
  {
    title: "Operations Risk Controls",
    href: "/operations/risk",
    description: "Limit monitoring, breach workflow, and escalation runbooks.",
  },
  {
    title: "Options Risk Dashboard",
    href: "/options/risk-dashboard",
    description: "Scenario coverage, vega allocation, and live hedging posture.",
  },
];

function getUpcomingDate(month: number, day: number, reference: Date) {
  const candidate = new Date(reference.getFullYear(), month, day);
  if (candidate < reference) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

function getGlobalHolidays(reference: Date) {
  return HOLIDAY_SEEDS.map((seed) => ({
    ...seed,
    date: getUpcomingDate(seed.month, seed.day, reference),
  })).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatPnL(value: number) {
  const formatted = `$${Math.abs(value).toFixed(2)}M`;
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

export default function DeskDashboardLanding() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const holidays = useMemo(() => getGlobalHolidays(today), [today]);
  const selectedHolidayDates = useMemo(
    () => holidays.map((holiday) => holiday.date),
    [holidays],
  );
  const upcomingHolidays = useMemo(() => holidays.slice(0, 5), [holidays]);

  return (
    <PageTemplate
      title="Desk Dashboard"
      description="Stay ahead of the trading day with the global holiday calendar, desk P&L flash, and shortcuts into the deeper dashboards."
    >
      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Global Market Calendar</CardTitle>
              <CardDescription>
                Key exchange holidays and partial sessions to plan liquidity and staffing.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1 text-xs">
              <CalendarDays className="size-3.5" aria-hidden />
              {format(today, "MMMM d, yyyy")}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
              <div className="flex justify-center lg:justify-start">
                <Calendar
                  mode="multiple"
                  selected={selectedHolidayDates}
                  modifiers={{ holiday: selectedHolidayDates }}
                  modifiersClassNames={{
                    holiday: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                  }}
                  numberOfMonths={1}
                />
              </div>
              <div className="space-y-3">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={`${holiday.label}-${holiday.region}`}
                    className="flex items-start justify-between rounded-lg border bg-muted/40 p-3"
                  >
                    <div>
                      <p className="font-medium leading-tight">
                        {holiday.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {holiday.region} • {format(holiday.date, "EEE, MMM d")}
                      </p>
                    </div>
                    <Badge
                      variant={holiday.impact === "Closed" ? "destructive" : "outline"}
                      className="whitespace-nowrap"
                    >
                      {holiday.impact === "Closed" ? "Closed" : "Partial"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Department P&L</CardTitle>
            <CardDescription>
              Flash results versus plan to coordinate follow-ups with each lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                  <TableHead className="text-right">vs Plan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentPnls.map((row) => {
                  const TrendIcon = row.pnl >= 0 ? TrendingUp : TrendingDown;
                  const variancePositive = row.planVariance >= 0;

                  return (
                    <TableRow key={row.department}>
                      <TableCell className="font-medium">{row.department}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            row.pnl >= 0
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-rose-500 dark:text-rose-400"
                          }
                        >
                          {formatPnL(row.pnl)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            variancePositive
                              ? "inline-flex items-center justify-end gap-1 text-emerald-500 dark:text-emerald-400"
                              : "inline-flex items-center justify-end gap-1 text-rose-500 dark:text-rose-400"
                          }
                        >
                          <TrendIcon className="size-3.5" aria-hidden />
                          {formatPnL(row.planVariance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Useful Links</CardTitle>
          <CardDescription>
            Jump directly into the dashboards most frequently referenced during the morning run-through.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {usefulLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="group flex h-full flex-col justify-between rounded-lg border bg-card p-4 transition hover:border-primary"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {link.title}
                      <ArrowUpRight
                        className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      />
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
