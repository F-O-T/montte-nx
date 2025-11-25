import { useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

export function useActiveOrganization() {
   const trpc = useTRPC();
   const slug = useParams({
      from: "/_dashboard/$slug",
      select: (params) => params.slug,
   });

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const activeOrganization =
      organizations?.find((organization) => organization.slug === slug) ??
      organizations[0];

   return activeOrganization;
}
