import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/root-redirect.tsx"),
  layout("routes/lang-layout.tsx", [route(":lang", "routes/dashboard.tsx")]),
] satisfies RouteConfig;
