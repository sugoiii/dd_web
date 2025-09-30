import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("./layout.tsx", [
    route("/etn", "./pages/etn/main.tsx"),
    route("/etn/pnl", "./pages/etn/pnl.tsx"),
    route("/etn/realtime", "./pages/etn/realtime.tsx"),
    route("/etn/holdings", "./pages/etn/holdings.tsx"),
    route("/management", "./pages/management/overview.tsx"),
    route("/management/cash-control", "./pages/management/cash-control.tsx"),
    route("/management/fees-adjustments", "./pages/management/fees-adjustments.tsx"),
    route(
      "/management/reconciliation-workbench",
      "./pages/management/reconciliation-workbench.tsx",
    ),
    route("/management/valuation-oversight", "./pages/management/valuation-oversight.tsx"),
    route("/research/market-overview", "./pages/research/market-overview.tsx"),
    route("/research/signals", "./pages/research/signals.tsx"),
    route("/operations/risk", "./pages/operations/risk.tsx"),
    route("/market-making/monitor", "./pages/market-making/monitor.tsx"),
    route("/operations/blotter", "./pages/operations/blotter.tsx"),
    route("/operations/team", "./pages/operations/team.tsx"),
    route("/operations/preferences", "./pages/operations/preferences.tsx"),
  ]),
] satisfies RouteConfig;
