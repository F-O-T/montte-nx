import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getQueryClient, reservedRoutes, trpc } from "@/integrations/clients";

export const Route = createFileRoute("/_dashboard/$slug")({
   beforeLoad: async ({ params, location }) => {
      const queryClient = getQueryClient();
      const organizations = await queryClient.fetchQuery(
         trpc.organization.getOrganizations.queryOptions(),
      );
      const firstSlug = organizations[0]?.slug;

      const isReservedSlug = reservedRoutes.includes(params.slug);

      if (isReservedSlug && firstSlug) {
         throw redirect({
            params: { slug: firstSlug },
            search: location.search,
            to: "/$slug/home",
         });
      }
   },
   component: () => <Outlet />,
});
