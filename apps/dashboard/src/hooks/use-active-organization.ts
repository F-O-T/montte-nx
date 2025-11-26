import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTRPC } from "@/integrations/clients";

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
      (organizations[0] || defaultOrg);

   return { activeOrganization };
}

const defaultOrg = {
   createdAt: new Date(),
   description: "Personal account",
   id: "personal",
   logo: null,
   members: [],
   name: "Personal",
   slug: "personal",
   updatedAt: new Date(),
};
