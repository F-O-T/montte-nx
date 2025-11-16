import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/home")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Home",
   },
});

function RouteComponent() {
   return <div>Hello "/_dashboard/"!</div>;
}
