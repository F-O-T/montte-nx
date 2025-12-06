import { useSuspenseQuery } from "@tanstack/react-query";
import { betterAuthClient } from "@/integrations/clients";
import { useActiveOrganization } from "./use-active-organization";

export const useActivePlan = () => {
   const { activeOrganization } = useActiveOrganization();

   const { data: subscriptions } = useSuspenseQuery({
      queryFn: async () => {
         const result = await betterAuthClient.subscription.list({
            query: {
               referenceId: activeOrganization?.id,
            },
         });
         return result.data;
      },
      queryKey: ["subscriptions", activeOrganization?.id],
   });

   const currentSubscription = subscriptions?.find(
      (sub) => sub.status === "active" || sub.status === "trialing",
   );

   return {
      currentSubscription,
   };
};
