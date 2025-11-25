import { useIsomorphicLayoutEffect } from "@packages/ui/hooks/use-isomorphic-layout-effect";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getQueryClient, useTRPC } from "@/integrations/clients";

import { SignInPage } from "@/pages/sign-in/ui/sign-in-page";

export const Route = createFileRoute("/auth/sign-in")({
   component: RouteComponent,
});

function RouteComponent() {
   const trpc = useTRPC();
   const router = useRouter();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   useIsomorphicLayoutEffect(() => {
      if (session) {
         const queryClient = getQueryClient();

         queryClient
            .fetchQuery(trpc.organization.getOrganizations.queryOptions())
            .then((organization) => {
               console.log("organization", organization);
               // TODO > move to a const the defualt
               router.navigate({
                  params: { slug: organization[0]?.slug ?? "" },
                  replace: true,
                  search: location.search,
                  to: "/$slug/home",
               });
            });
      }
   }, [session, location]);

   return <SignInPage />;
}
