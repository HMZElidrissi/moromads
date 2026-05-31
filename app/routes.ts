import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("spots/:slug", "routes/spot-details.tsx"),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
