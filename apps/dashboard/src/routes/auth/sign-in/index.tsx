import { createFileRoute, redirect } from "@tanstack/react-router";
import { getQueryClient, trpc } from "@/integrations/clients";
import { SignInPage } from "@/pages/sign-in/ui/sign-in-page";

export const Route = createFileRoute("/auth/sign-in/")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();
      const session = await queryClient
         .fetchQuery(trpc.session.getSession.queryOptions())
         .catch(() => null);
      if (session) {
         throw redirect({ params: { slug: "" }, to: "/$slug/home" });
      }
   },
   component: RouteComponent,
});

function RouteComponent() {
   return <SignInPage />;
}
