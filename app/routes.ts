import { type RouteConfig, index, layout, route, prefix } from "@react-router/dev/routes";

type NavItem = {
  title: string;
  key: string;
  icon?: React.ElementType;
  children?: NavItem[];
  keys?: string[];
  titles?: string[]
};

export default [
  layout("./layout.tsx", [
    index("routes/home.tsx"),
    route("/etn/pnl", "./pages/etn/pnl.tsx"),
    route("/etn/realtime", "./pages/etn/realtime.tsx"),
  ])
] satisfies RouteConfig;
export {type NavItem};
