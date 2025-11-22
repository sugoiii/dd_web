import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

const dashboardRoutes = [index("./pages/main.tsx")];

const etnRoutes = [
  route("/etn", "./pages/etn/main.tsx"),
  route("/etn/pnl", "./pages/etn/pnl.tsx"),
  route("/etn/realtime", "./pages/etn/realtime.tsx"),
  route("/etn/holdings", "./pages/etn/holdings.tsx"),
];

const strategyRoutes = [
  route("/strategy/delta1-basis", "./pages/strategy/delta1-basis-monitor.tsx"),
  route("/strategy/realtime-management", "./pages/strategy/realtime-management.tsx"),
  route("/strategy/equity-hedge-cockpit", "./pages/strategy/equity-hedge-cockpit.tsx"),
];

export default [layout("./layout.tsx", [...dashboardRoutes, ...etnRoutes, ...strategyRoutes])] satisfies RouteConfig;
