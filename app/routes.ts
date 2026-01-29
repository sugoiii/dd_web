import { type RouteConfig, layout, route } from "@react-router/dev/routes";

import { commonRoutes } from "./routes/common";
import { dashboardRoutes } from "./routes/dashboard";
import { marketMonitorRoutes } from "./routes/market-monitor";

export default [
  layout("./layout.tsx", [
    ...dashboardRoutes,
    route("common", "./pages/common/layout.tsx", commonRoutes),
    route("market-monitor", "./pages/market-monitor/layout.tsx", marketMonitorRoutes),
  ]),
] satisfies RouteConfig;
