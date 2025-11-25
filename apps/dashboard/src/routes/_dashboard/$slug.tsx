import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/$slug")({
   beforeLoad: async ({ params }) => {
      console.log("params", params);
   },
   component: () => <Outlet />,
});
