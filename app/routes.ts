import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("spots/:slug", "routes/spot-details.tsx"),
  route("add-spot", "routes/add-spot.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/logout", "routes/admin.logout.tsx"),
  route("about", "routes/about.tsx"),
  route("images/*", "routes/images.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
