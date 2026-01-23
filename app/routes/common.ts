import { index, route } from "@react-router/dev/routes";

export const commonRoutes = [
  route("common", "./pages/common/layout.tsx", [index("./pages/common/main.tsx")]),
];
