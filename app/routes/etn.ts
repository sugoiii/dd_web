import { index, route } from "@react-router/dev/routes";

export const etnRoutes = [
  index("./pages/etn/main.tsx"),
  route("pnl", "./pages/etn/pnl.tsx"),
  route("realtime", "./pages/etn/realtime.tsx"),
  route("holdings", "./pages/etn/holdings.tsx"),
];
