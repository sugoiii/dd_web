import { useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";
import type { ColDef } from "ag-grid-enterprise";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { CalendarDays } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

ModuleRegistry.registerModules([AllEnterpriseModule]);

const ALL_TEAMS_VALUE = "ALL";

type TeamSummaryRow = {
  department: string;
  team: string;
  manager: string;
  headcount: number;
  dayPnl: number;
  mtd: number;
  ytd: number;
  planVariance: number;
  riskUsage: number;
};

type FundPnlRow = {
  department: string;
  team: string;
  fund: string;
  vehicle: string;
  aum: number;
  dayPnl: number;
  mtd: number;
  ytd: number;
  hitRate: number;
};

type ConstituentRow = {
  department: string;
  team: string;
  fund: string;
  bucket: string;
  driver: string;
  dayPnl: number;
  commentary: string;
};

const TEAM_SUMMARY_ROWS: TeamSummaryRow[] = [
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    manager: "Soobin Choi",
    headcount: 6,
    dayPnl: 1.28,
    mtd: 8.64,
    ytd: 42.3,
    planVariance: 0.22,
    riskUsage: 0.63,
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Japan",
    manager: "Daichi Watanabe",
    headcount: 5,
    dayPnl: 0.74,
    mtd: 6.12,
    ytd: 29.1,
    planVariance: 0.08,
    riskUsage: 0.57,
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    manager: "Priya Raman",
    headcount: 7,
    dayPnl: 0.38,
    mtd: 5.04,
    ytd: 21.5,
    planVariance: -0.12,
    riskUsage: 0.48,
  },
  {
    department: "Systematic Macro",
    team: "FX Carry",
    manager: "Tomás Alvarez",
    headcount: 4,
    dayPnl: -0.19,
    mtd: 1.32,
    ytd: 10.4,
    planVariance: -0.21,
    riskUsage: 0.41,
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    manager: "Mira Chen",
    headcount: 5,
    dayPnl: 0.91,
    mtd: 7.85,
    ytd: 33.7,
    planVariance: 0.34,
    riskUsage: 0.69,
  },
];

const FUND_PNL_ROWS: FundPnlRow[] = [
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    fund: "KOSPI Overlay Fund",
    vehicle: "UCITS",
    aum: 1.38,
    dayPnl: 0.42,
    mtd: 2.73,
    ytd: 11.8,
    hitRate: 0.61,
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    fund: "Asia Close-Out Basket",
    vehicle: "Segregated",
    aum: 0.92,
    dayPnl: 0.31,
    mtd: 2.04,
    ytd: 9.6,
    hitRate: 0.58,
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Japan",
    fund: "TOPIX Spread Fund",
    vehicle: "Segregated",
    aum: 1.12,
    dayPnl: 0.28,
    mtd: 1.89,
    ytd: 8.5,
    hitRate: 0.55,
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Japan",
    fund: "Nikkei Program Trading",
    vehicle: "UCITS",
    aum: 0.87,
    dayPnl: 0.21,
    mtd: 1.24,
    ytd: 5.6,
    hitRate: 0.52,
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    fund: "Rates Carry Overlay",
    vehicle: "Offshore",
    aum: 1.54,
    dayPnl: 0.19,
    mtd: 1.96,
    ytd: 7.9,
    hitRate: 0.57,
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    fund: "Swap Spread Relative Value",
    vehicle: "Segregated",
    aum: 0.75,
    dayPnl: 0.11,
    mtd: 1.02,
    ytd: 4.8,
    hitRate: 0.49,
  },
  {
    department: "Systematic Macro",
    team: "FX Carry",
    fund: "Emerging FX Carry",
    vehicle: "Offshore",
    aum: 0.64,
    dayPnl: -0.09,
    mtd: 0.38,
    ytd: 2.3,
    hitRate: 0.46,
  },
  {
    department: "Systematic Macro",
    team: "FX Carry",
    fund: "Developed FX Tilt",
    vehicle: "UCITS",
    aum: 0.58,
    dayPnl: -0.05,
    mtd: 0.21,
    ytd: 1.8,
    hitRate: 0.43,
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    fund: "Custom Basket Notes",
    vehicle: "Notes",
    aum: 1.21,
    dayPnl: 0.37,
    mtd: 2.56,
    ytd: 10.7,
    hitRate: 0.63,
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    fund: "Thematic Auto-Calls",
    vehicle: "Notes",
    aum: 0.98,
    dayPnl: 0.29,
    mtd: 2.18,
    ytd: 9.2,
    hitRate: 0.6,
  },
];

const CONSTITUENT_ROWS: ConstituentRow[] = [
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    fund: "KOSPI Overlay Fund",
    bucket: "Index Futures",
    driver: "KOSPI 200 roll",
    dayPnl: 0.24,
    commentary: "Tighter basis after roll calendar matched broker street.",
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    fund: "KOSPI Overlay Fund",
    bucket: "Dividends",
    driver: "Special dividends",
    dayPnl: 0.11,
    commentary: "Two corporate actions priced through forwards.",
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    fund: "Asia Close-Out Basket",
    bucket: "ETF Hedging",
    driver: "Tracking error alpha",
    dayPnl: 0.17,
    commentary: "Residual tracking error captured on rebalance.",
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Japan",
    fund: "TOPIX Spread Fund",
    bucket: "Index Futures",
    driver: "Spread tightening",
    dayPnl: 0.16,
    commentary: "Overnight spread normalized post BoJ communication.",
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    fund: "Rates Carry Overlay",
    bucket: "Curve Trades",
    driver: "Steepener",
    dayPnl: 0.12,
    commentary: "2s10s steepener benefited from US CPI surprise.",
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    fund: "Swap Spread Relative Value",
    bucket: "Swap Spreads",
    driver: "USD 5Y",
    dayPnl: 0.08,
    commentary: "Spread retracement after month-end flows faded.",
  },
  {
    department: "Systematic Macro",
    team: "FX Carry",
    fund: "Emerging FX Carry",
    bucket: "EM FX",
    driver: "LatAm carry",
    dayPnl: -0.06,
    commentary: "BRL and CLP weakened after local policy chatter.",
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    fund: "Custom Basket Notes",
    bucket: "Single Stock Hedges",
    driver: "Vol compression",
    dayPnl: 0.21,
    commentary: "Hedge unwind gains after realized vol collapsed.",
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    fund: "Thematic Auto-Calls",
    bucket: "Gamma Carry",
    driver: "KOSDAQ tech",
    dayPnl: 0.18,
    commentary: "Positive gamma from structured product book.",
  },
];

function formatMillions(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return "-";
  }
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${Math.abs(value).toFixed(2)}M`;
}

function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `${(value * 100).toFixed(0)}%`;
}

function formatAum(value?: number) {
  if (value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return `$${value.toFixed(2)}B`;
}

export default function MiddleLevelPnlPage() {
  const [tradeDate, setTradeDate] = useState(() => startOfDay(new Date()));

  const { departmentOptions, teamsByDepartment } = useMemo(() => {
    const departments = Array.from(new Set(TEAM_SUMMARY_ROWS.map((row) => row.department)));
    const mapping = departments.reduce<Record<string, string[]>>((acc, department) => {
      acc[department] = TEAM_SUMMARY_ROWS.filter((row) => row.department === department).map((row) => row.team);
      return acc;
    }, {});
    return { departmentOptions: departments, teamsByDepartment: mapping };
  }, []);

  const [selectedDepartment, setSelectedDepartment] = useState(() => departmentOptions[0]);
  const [selectedTeam, setSelectedTeam] = useState<string>(ALL_TEAMS_VALUE);

  useEffect(() => {
    setSelectedTeam(ALL_TEAMS_VALUE);
  }, [selectedDepartment]);

  const teamOptions = teamsByDepartment[selectedDepartment] ?? [];

  const filteredTeams = useMemo(
    () =>
      TEAM_SUMMARY_ROWS.filter((row) => {
        return (
          row.department === selectedDepartment &&
          (selectedTeam === ALL_TEAMS_VALUE || row.team === selectedTeam)
        );
      }),
    [selectedDepartment, selectedTeam],
  );

  const filteredFunds = useMemo(
    () =>
      FUND_PNL_ROWS.filter((row) => {
        if (row.department !== selectedDepartment) return false;
        if (selectedTeam === ALL_TEAMS_VALUE) return true;
        return row.team === selectedTeam;
      }),
    [selectedDepartment, selectedTeam],
  );

  const filteredConstituents = useMemo(
    () =>
      CONSTITUENT_ROWS.filter((row) => {
        if (row.department !== selectedDepartment) return false;
        if (selectedTeam === ALL_TEAMS_VALUE) return true;
        return row.team === selectedTeam;
      }),
    [selectedDepartment, selectedTeam],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    [],
  );

  const deltaClassRules = useMemo(
    () => ({
      "text-emerald-600 font-medium": (params: { value?: number }) => (params.value ?? 0) > 0,
      "text-red-600 font-medium": (params: { value?: number }) => (params.value ?? 0) < 0,
    }),
    [],
  );

  const teamColumns = useMemo<ColDef<TeamSummaryRow>[]>(
    () => [
      { field: "team", headerName: "Team", minWidth: 200 },
      { field: "manager", headerName: "Lead", minWidth: 160 },
      { field: "headcount", headerName: "HC", width: 90, filter: "agNumberColumnFilter" },
      {
        field: "dayPnl",
        headerName: "Day P&L",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "mtd",
        headerName: "MTD",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "ytd",
        headerName: "YTD",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "planVariance",
        headerName: "vs Plan",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "riskUsage",
        headerName: "Risk Utilization",
        valueFormatter: (params) => formatPercent(params.value as number),
        minWidth: 160,
      },
    ],
    [deltaClassRules],
  );

  const fundColumns = useMemo<ColDef<FundPnlRow>[]>(
    () => [
      { field: "fund", headerName: "Fund", minWidth: 220 },
      { field: "vehicle", headerName: "Vehicle", minWidth: 140 },
      {
        field: "aum",
        headerName: "AUM",
        valueFormatter: (params) => formatAum(params.value as number),
        minWidth: 140,
      },
      {
        field: "dayPnl",
        headerName: "Day P&L",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "mtd",
        headerName: "MTD",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "ytd",
        headerName: "YTD",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "hitRate",
        headerName: "Hit Rate",
        valueFormatter: (params) => formatPercent(params.value as number),
        minWidth: 130,
      },
    ],
    [deltaClassRules],
  );

  const constituentColumns = useMemo<ColDef<ConstituentRow>[]>(
    () => [
      { field: "fund", headerName: "Fund", minWidth: 220 },
      { field: "bucket", headerName: "PnL Bucket", minWidth: 160 },
      { field: "driver", headerName: "Driver", minWidth: 160 },
      {
        field: "dayPnl",
        headerName: "Contribution",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 150,
      },
      { field: "commentary", headerName: "Commentary", minWidth: 260, flex: 1.4, wrapText: true, autoHeight: true },
    ],
    [deltaClassRules],
  );

  const totals = useMemo(() => {
    if (filteredTeams.length === 0) {
      return {
        day: 0,
        mtd: 0,
        ytd: 0,
        plan: 0,
        avgRisk: 0,
        teams: 0,
        funds: filteredFunds.length,
      };
    }
    const aggregates = filteredTeams.reduce(
      (acc, row) => {
        acc.day += row.dayPnl;
        acc.mtd += row.mtd;
        acc.ytd += row.ytd;
        acc.plan += row.planVariance;
        acc.risk += row.riskUsage;
        return acc;
      },
      { day: 0, mtd: 0, ytd: 0, plan: 0, risk: 0 },
    );
    return {
      day: aggregates.day,
      mtd: aggregates.mtd,
      ytd: aggregates.ytd,
      plan: aggregates.plan,
      avgRisk: aggregates.risk / filteredTeams.length,
      teams: filteredTeams.length,
      funds: filteredFunds.length,
    };
  }, [filteredTeams, filteredFunds.length]);

  const tradeDateLabel = useMemo(() => format(tradeDate, "dd MMM yyyy"), [tradeDate]);

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col gap-6 px-4 pb-8 pt-6 lg:px-6 xl:px-8">
        <header className="flex flex-col gap-4 border-b border-border/70 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Middle-Level P&L</h1>
            <p className="text-sm text-muted-foreground">
              Daily oversight of team performance, fund attribution, and component drivers.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Trade date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex h-9 w-[180px] items-center justify-start gap-2 text-left font-medium",
                      "hover:bg-muted/60",
                    )}
                  >
                    <CalendarDays className="size-4" aria-hidden />
                    {tradeDateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tradeDate}
                    onSelect={(nextDate) => nextDate && setTradeDate(startOfDay(nextDate))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Department</span>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Team</span>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_TEAMS_VALUE}>All teams</SelectItem>
                  {teamOptions.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border/80 bg-background/80 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Day P&L</p>
              <p className="mt-1 text-lg font-semibold">{formatMillions(totals.day)}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/80 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">MTD</p>
              <p className="mt-1 text-lg font-semibold">{formatMillions(totals.mtd)}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/80 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Average risk usage</p>
              <p className="mt-1 text-lg font-semibold">{formatPercent(totals.avgRisk)}</p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/80 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Scope</p>
              <p className="mt-1 text-lg font-semibold">
                {totals.teams} teams • {totals.funds} funds
              </p>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Team summary</h2>
            <span className="text-xs text-muted-foreground">
              Showing {selectedTeam === ALL_TEAMS_VALUE ? "all teams" : selectedTeam}
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-border/80 bg-background/80">
            <AgGridReact<TeamSummaryRow>
              rowData={filteredTeams}
              columnDefs={teamColumns}
              defaultColDef={defaultColDef}
              animateRows
              domLayout="autoHeight"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr,1fr] xl:items-start">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Fund attribution</h2>
              <span className="text-xs text-muted-foreground">{filteredFunds.length} funds in view</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/80 bg-background/80">
              <AgGridReact<FundPnlRow>
                rowData={filteredFunds}
                columnDefs={fundColumns}
                defaultColDef={defaultColDef}
                animateRows
                domLayout="autoHeight"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">PnL constituents</h2>
              <span className="text-xs text-muted-foreground">{filteredConstituents.length} line items</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border/80 bg-background/80">
              <AgGridReact<ConstituentRow>
                rowData={filteredConstituents}
                columnDefs={constituentColumns}
                defaultColDef={defaultColDef}
                animateRows
                domLayout="autoHeight"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

