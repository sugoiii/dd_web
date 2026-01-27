import { type RouteConfig, layout, route } from "@react-router/dev/routes";

import { commonRoutes } from "./routes/common";
import { dashboardRoutes } from "./routes/dashboard";

export default [layout("./layout.tsx", [...dashboardRoutes, route("common", "./pages/common/layout.tsx", commonRoutes)])] satisfies RouteConfig;
