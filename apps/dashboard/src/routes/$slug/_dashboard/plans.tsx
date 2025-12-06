import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { PlansPage } from "@/pages/plans/ui/plans-page";

export const Route = createFileRoute("/$slug/_dashboard/plans")({
   beforeLoad({ search, location }) {
      if (search.success !== "true") return;

      toast.success("Assinatura realizada com sucesso!", {
         description: "Seu plano foi ativado.",
      });

      throw redirect({
         replace: true,
         to: location.pathname,
      });
   },
   component: RouteComponent,
   staticData: {
      breadcrumb: "Planos",
   },
   validateSearch: (search: Record<string, unknown>) => ({
      success: search.success as string | undefined,
   }),
});

function RouteComponent() {
   return <PlansPage />;
}
