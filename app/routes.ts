import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

const dashboardRoutes = [index("./pages/main.tsx")];

const managementRoutes = [
  route("/management", "./pages/management/overview.tsx"),
  route("/management/cash-control", "./pages/management/cash-control.tsx"),
  route(
    "/management/fees-adjustments",
    "./pages/management/fees-adjustments.tsx",
  ),
  route(
    "/management/middle-level-pnl",
    "./pages/management/middle-level-pnl.tsx",
  ),
  route(
    "/management/reconciliation-workbench",
    "./pages/management/reconciliation-workbench.tsx",
  ),
  route(
    "/management/valuation-oversight",
    "./pages/management/valuation-oversight.tsx",
  ),
];

const etnRoutes = [
  route("/etn", "./pages/etn/main.tsx"),
  route("/etn/pnl", "./pages/etn/pnl.tsx"),
  route("/etn/realtime", "./pages/etn/realtime.tsx"),
  route("/etn/holdings", "./pages/etn/holdings.tsx"),
];

const researchRoutes = [
  route("/research/market-overview", "./pages/research/market-overview.tsx"),
  route("/research/signals", "./pages/research/signals.tsx"),
];

const operationsRoutes = [
  route("/operations/risk", "./pages/operations/risk.tsx"),
  route("/operations/blotter", "./pages/operations/blotter.tsx"),
  route("/operations/team", "./pages/operations/team.tsx"),
  route("/operations/preferences", "./pages/operations/preferences.tsx"),
];

const optionsRoutes = [
  route("/options/realtime", "./pages/options/realtime.tsx"),
  route("/options/risk-dashboard", "./pages/options/risk-dashboard.tsx"),
  route("/options/strategy-lab", "./pages/options/strategy-lab.tsx"),
];

const marketMakingRoutes = [
  route("/market-making/monitor", "./pages/market-making/monitor.tsx"),
  route("/market-making/krx-gold", "./pages/market-making/krx-gold-monitor.tsx"),
  route("/market-making/krx-basis", "./pages/market-making/krx-basis-trading.tsx"),
];

const strategyRoutes = [
  route("/strategy/realtime-management", "./pages/strategy/realtime-management.tsx"),
];

export default [
  layout("./layout.tsx", [
    ...dashboardRoutes,
    ...managementRoutes,
    ...etnRoutes,
    ...researchRoutes,
    ...operationsRoutes,
    ...optionsRoutes,
    ...marketMakingRoutes,
    ...strategyRoutes,
  ]),
] satisfies RouteConfig;
