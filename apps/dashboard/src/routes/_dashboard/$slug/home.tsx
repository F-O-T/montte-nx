import { HomePage } from "@/pages/home/ui/home-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/$slug/home")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Home",
   },
});

function RouteComponent() {
   return <HomePage />;
}
