import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, startOfDay } from "date-fns";
import type { ColDef, RowClickedEvent } from "ag-grid-community";
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

const ALL_TEAMS_VALUE = "ALL";
const ALL_FUNDS_VALUE = "ALL_FUNDS";

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
  monthlyLossLimit: number;
  quarterlyLossLimit: number;
  notionalLimit: number;
  status: "Within limits" | "Watch" | "Restricted";
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

type TeamBasisRow = {
  department: string;
  team: string;
  basis: string;
  exposure: number;
  pnlImpact: number;
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
    monthlyLossLimit: -4.5,
    quarterlyLossLimit: -12.5,
    notionalLimit: 2.1,
    status: "Within limits",
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
    monthlyLossLimit: -3.8,
    quarterlyLossLimit: -11.2,
    notionalLimit: 1.8,
    status: "Within limits",
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
    monthlyLossLimit: -5.2,
    quarterlyLossLimit: -14.6,
    notionalLimit: 2.8,
    status: "Watch",
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
    monthlyLossLimit: -2.6,
    quarterlyLossLimit: -7.4,
    notionalLimit: 1.3,
    status: "Within limits",
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
    monthlyLossLimit: -4.1,
    quarterlyLossLimit: -12.1,
    notionalLimit: 2.4,
    status: "Within limits",
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

const TEAM_BASIS_ROWS: TeamBasisRow[] = [
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    basis: "KOSPI vs. Futures",
    exposure: 1.2,
    pnlImpact: 0.18,
    commentary: "Tightened post expiry; hedges rolled with minimal slippage.",
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Korea",
    basis: "ETF vs. Basket",
    exposure: 0.9,
    pnlImpact: 0.11,
    commentary: "Residual dispersion favorable to long basis positions.",
  },
  {
    department: "Index Arbitrage",
    team: "Index Arb — Japan",
    basis: "TOPIX Cash vs. Futures",
    exposure: 1,
    pnlImpact: 0.14,
    commentary: "Overnight rebalancing drove supportive flow.",
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    basis: "UST vs. OIS",
    exposure: 1.6,
    pnlImpact: 0.09,
    commentary: "Spread narrowed alongside swap spread normalization.",
  },
  {
    department: "Systematic Macro",
    team: "Global Rates",
    basis: "Euribor vs. Bund",
    exposure: 1.1,
    pnlImpact: 0.07,
    commentary: "ECB guidance kept front-end stable; carry accrued.",
  },
  {
    department: "Systematic Macro",
    team: "FX Carry",
    basis: "BRL NDF vs. Futures",
    exposure: 0.7,
    pnlImpact: -0.05,
    commentary: "Hawkish BCB rhetoric steepened the curve; carry moderated.",
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    basis: "Basket vs. Swap",
    exposure: 1.4,
    pnlImpact: 0.16,
    commentary: "Structured product delta hedges monetized implied premium.",
  },
  {
    department: "Options Structuring",
    team: "Delta One Solutions",
    basis: "Single Stock vs. ADR",
    exposure: 0.8,
    pnlImpact: 0.12,
    commentary: "Cross-listing basis converged after liquidity window.",
  },
];

const TEAM_STATUS_STYLES: Record<TeamSummaryRow["status"], string> = {
  "Within limits": "border-emerald-200 bg-emerald-100 text-emerald-700",
  Watch: "border-amber-200 bg-amber-100 text-amber-700",
  Restricted: "border-red-200 bg-red-100 text-red-700",
};

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
  const teamGridRef = useRef<AgGridReact<TeamSummaryRow>>(null);
  const fundGridRef = useRef<AgGridReact<FundPnlRow>>(null);

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
  const [selectedFund, setSelectedFund] = useState<string>(ALL_FUNDS_VALUE);

  useEffect(() => {
    setSelectedTeam(ALL_TEAMS_VALUE);
    setSelectedFund(ALL_FUNDS_VALUE);
  }, [selectedDepartment]);

  const teamOptions = teamsByDepartment[selectedDepartment] ?? [];

  const departmentTeams = useMemo(
    () => TEAM_SUMMARY_ROWS.filter((row) => row.department === selectedDepartment),
    [selectedDepartment],
  );

  const scopedTeams = useMemo(() => {
    if (selectedTeam === ALL_TEAMS_VALUE) {
      return departmentTeams;
    }
    return departmentTeams.filter((row) => row.team === selectedTeam);
  }, [departmentTeams, selectedTeam]);

  const filteredFunds = useMemo(() => {
    return FUND_PNL_ROWS.filter((row) => {
      if (row.department !== selectedDepartment) return false;
      if (selectedTeam !== ALL_TEAMS_VALUE && row.team !== selectedTeam) return false;
      return true;
    });
  }, [selectedDepartment, selectedTeam]);

  const filteredConstituents = useMemo(() => {
    return CONSTITUENT_ROWS.filter((row) => {
      if (row.department !== selectedDepartment) return false;
      if (selectedTeam !== ALL_TEAMS_VALUE && row.team !== selectedTeam) return false;
      if (selectedFund !== ALL_FUNDS_VALUE && row.fund !== selectedFund) return false;
      return true;
    });
  }, [selectedDepartment, selectedTeam, selectedFund]);

  const selectedTeamBasisRows = useMemo(() => {
    if (selectedTeam === ALL_TEAMS_VALUE) {
      return [] as TeamBasisRow[];
    }
    return TEAM_BASIS_ROWS.filter(
      (row) => row.department === selectedDepartment && row.team === selectedTeam,
    );
  }, [selectedDepartment, selectedTeam]);

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

  const teamBasisColumns = useMemo<ColDef<TeamBasisRow>[]>(
    () => [
      { field: "basis", headerName: "Basis", minWidth: 200 },
      {
        field: "exposure",
        headerName: "Exposure",
        valueFormatter: (params) => formatAum(params.value as number),
        minWidth: 140,
      },
      {
        field: "pnlImpact",
        headerName: "Day P&L",
        valueFormatter: (params) => formatMillions(params.value as number),
        cellClassRules: deltaClassRules,
        minWidth: 140,
      },
      {
        field: "commentary",
        headerName: "Commentary",
        minWidth: 260,
        flex: 1.4,
        wrapText: true,
        autoHeight: true,
      },
    ],
    [deltaClassRules],
  );

  const selectedTeamDetails = useMemo(() => {
    if (selectedTeam === ALL_TEAMS_VALUE) {
      return null;
    }
    return departmentTeams.find((row) => row.team === selectedTeam) ?? null;
  }, [departmentTeams, selectedTeam]);

  const totals = useMemo(() => {
    if (scopedTeams.length === 0) {
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
    const aggregates = scopedTeams.reduce(
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
      avgRisk: aggregates.risk / scopedTeams.length,
      teams: scopedTeams.length,
      funds: filteredFunds.length,
    };
  }, [scopedTeams, filteredFunds.length]);

  const tradeDateLabel = useMemo(() => format(tradeDate, "dd MMM yyyy"), [tradeDate]);

  const handleTeamRowClicked = useCallback(
    (event: RowClickedEvent<TeamSummaryRow>) => {
      const team = event.data?.team;
      if (!team) return;
      setSelectedTeam((current) => (current === team ? ALL_TEAMS_VALUE : team));
    },
    [],
  );

  const handleFundRowClicked = useCallback(
    (event: RowClickedEvent<FundPnlRow>) => {
      const fund = event.data?.fund;
      if (!fund) return;
      setSelectedFund((current) => (current === fund ? ALL_FUNDS_VALUE : fund));
    },
    [],
  );

  useEffect(() => {
    if (selectedTeam === ALL_TEAMS_VALUE) {
      teamGridRef.current?.api?.deselectAll();
    } else {
      teamGridRef.current?.api?.forEachNode((node) => {
        node.setSelected(node.data?.team === selectedTeam);
      });
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedFund === ALL_FUNDS_VALUE) {
      fundGridRef.current?.api?.deselectAll();
    } else {
      fundGridRef.current?.api?.forEachNode((node) => {
        node.setSelected(node.data?.fund === selectedFund);
      });
    }
  }, [selectedFund]);

  useEffect(() => {
    setSelectedFund(ALL_FUNDS_VALUE);
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedFund === ALL_FUNDS_VALUE) {
      return;
    }
    const fundStillVisible = filteredFunds.some((row) => row.fund === selectedFund);
    if (!fundStillVisible) {
      setSelectedFund(ALL_FUNDS_VALUE);
    }
  }, [filteredFunds, selectedFund]);

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4 lg:px-6 xl:px-8">
        <div className="grid flex-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,5fr)] xl:items-start">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-6 rounded-lg border border-border/70 bg-background/80 p-4 shadow-sm shadow-black/5">
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
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
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                    <span>
                      Viewing {tradeDateLabel} • {selectedDepartment} •{" "}
                      {selectedTeam === ALL_TEAMS_VALUE ? "All teams" : selectedTeam}
                    </span>
                    <span>
                      Fund scope: {selectedFund === ALL_FUNDS_VALUE ? "All funds" : selectedFund}
                    </span>
                  </div>
                </div>
                <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Day P&L</p>
                      <p className="mt-1 text-lg font-semibold">{formatMillions(totals.day)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">MTD</p>
                      <p className="mt-1 text-lg font-semibold">{formatMillions(totals.mtd)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Average risk usage</p>
                      <p className="mt-1 text-lg font-semibold">{formatPercent(totals.avgRisk)}</p>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Scope</p>
                      <p className="mt-1 text-lg font-semibold">
                        {totals.teams} teams • {totals.funds} funds
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Team profile</h2>
                        <p className="text-xs text-muted-foreground">
                          Loss limits, governance status, and operating context.
                        </p>
                      </div>
                    </div>
                    {selectedTeamDetails ? (
                      <div className="mt-4 grid gap-2">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Governance status</p>
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold capitalize tracking-wide",
                              TEAM_STATUS_STYLES[selectedTeamDetails.status],
                            )}
                          >
                            {selectedTeamDetails.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Monthly loss limit</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatMillions(selectedTeamDetails.monthlyLossLimit)}
                          </p>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Quarterly loss limit</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatMillions(selectedTeamDetails.quarterlyLossLimit)}
                          </p>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Notional limit</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatAum(selectedTeamDetails.notionalLimit)}
                          </p>
                        </div>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground">Current risk utilisation</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatPercent(selectedTeamDetails.riskUsage)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Select a team from the summary grid to surface mandate limits and governance details.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">Team summary</h2>
                <span className="text-xs text-muted-foreground">
                  Showing {selectedTeam === ALL_TEAMS_VALUE ? "all teams" : selectedTeam}
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-background/80">
                <AgGridReact<TeamSummaryRow>
                  ref={teamGridRef}
                  rowData={departmentTeams}
                  columnDefs={teamColumns}
                  defaultColDef={defaultColDef}
                  animateRows
                  domLayout="autoHeight"
                  rowSelection="single"
                  onRowClicked={handleTeamRowClicked}
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">Fund attribution</h2>
                <span className="text-xs text-muted-foreground">{filteredFunds.length} funds in view</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-background/80">
                <AgGridReact<FundPnlRow>
                  ref={fundGridRef}
                  rowData={filteredFunds}
                  columnDefs={fundColumns}
                  defaultColDef={defaultColDef}
                  animateRows
                  domLayout="autoHeight"
                  rowSelection="single"
                  onRowClicked={handleFundRowClicked}
                />
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">Basis information</h2>
                {selectedTeamDetails ? (
                  <span className="text-xs text-muted-foreground">
                    {selectedTeamBasisRows.length} basis items
                  </span>
                ) : null}
              </div>
              {selectedTeamDetails ? (
                selectedTeamBasisRows.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-border/70 bg-background/80">
                    <AgGridReact<TeamBasisRow>
                      rowData={selectedTeamBasisRows}
                      columnDefs={teamBasisColumns}
                      defaultColDef={defaultColDef}
                      animateRows
                      domLayout="autoHeight"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/70 bg-background/80 p-6 text-sm text-muted-foreground">
                    No basis exposures recorded for this team.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
                  Choose a team to review detailed basis exposures.
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-foreground">PnL constituents</h2>
                <span className="text-xs text-muted-foreground">{filteredConstituents.length} line items</span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border/70 bg-background/80">
                <AgGridReact<ConstituentRow>
                  rowData={filteredConstituents}
                  columnDefs={constituentColumns}
                  defaultColDef={defaultColDef}
                  animateRows
                  domLayout="autoHeight"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

