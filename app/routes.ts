import { type RouteConfig, layout, route } from "@react-router/dev/routes";

import { commonRoutes } from "./routes/common";
import { dashboardRoutes } from "./routes/dashboard";
import { etnRoutes } from "./routes/etn";
import { strategyRoutes } from "./routes/strategy";

export default [
  layout("./layout.tsx", [
    ...dashboardRoutes,
    route("etn", "./pages/etn/layout.tsx", etnRoutes),
    route("strategy", "./pages/strategy/layout.tsx", strategyRoutes),
    ...commonRoutes,
  ]),
] satisfies RouteConfig;
