import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getQueryClient, trpc } from "@/integrations/clients";

export const Route = createFileRoute("/share-target")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();

      try {
         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         if (!organizations.length) {
            throw redirect({ to: "/auth/sign-in" });
         }
      } catch (error) {
         if (
            error instanceof Response ||
            (error as { isRedirect?: boolean })?.isRedirect
         ) {
            throw error;
         }
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: ShareTargetComponent,
});

function ShareTargetComponent() {
   const navigate = useNavigate();

   useEffect(() => {
      async function handleShare() {
         const queryClient = getQueryClient();

         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         const lastSlug = localStorage.getItem("montte:last-organization-slug");
         const foundOrg = lastSlug
            ? organizations.find((o) => o.slug === lastSlug)
            : null;
         const org = foundOrg ?? organizations[0];

         if (!org) {
            navigate({ to: "/auth/sign-in" });
            return;
         }

         const orgSlug = org.slug;

         const pendingShare = sessionStorage.getItem(
            "montte:pending-share-target",
         );

         if (pendingShare) {
            try {
               const data = JSON.parse(pendingShare) as {
                  content: string;
                  filename: string;
               };

               sessionStorage.removeItem("montte:pending-share-target");
               sessionStorage.setItem(
                  "montte:pending-ofx-import",
                  JSON.stringify({
                     content: data.content,
                     filename: data.filename,
                     timestamp: Date.now(),
                  }),
               );
            } catch {
               // Invalid data, ignore
            }
         }

         navigate({
            href: `/${orgSlug}/bank-accounts?selectForImport=true`,
         });
      }

      handleShare();
   }, [navigate]);

   return (
      <div className="flex h-screen items-center justify-center bg-background">
         <Loader2 className="size-8 animate-spin text-primary" />
      </div>
   );
}
