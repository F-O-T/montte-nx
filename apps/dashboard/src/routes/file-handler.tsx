import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getQueryClient, trpc } from "@/integrations/clients";

interface LaunchParams {
   files?: FileSystemFileHandle[];
}

interface LaunchQueue {
   setConsumer: (callback: (params: LaunchParams) => void) => void;
}

declare global {
   interface Window {
      launchQueue?: LaunchQueue;
   }
}

export const Route = createFileRoute("/file-handler")({
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
   component: FileHandlerComponent,
});

function FileHandlerComponent() {
   const navigate = useNavigate();

   useEffect(() => {
      async function handleLaunch() {
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

         if (window.launchQueue) {
            window.launchQueue.setConsumer(
               async (launchParams: LaunchParams) => {
                  if (!launchParams.files?.length || !launchParams.files[0]) {
                     navigate({
                        params: { slug: orgSlug },
                        to: "/$slug/import-ofx",
                     });
                     return;
                  }

                  const fileHandle = launchParams.files[0];
                  const file = await fileHandle.getFile();
                  const content = await file.text();

                  sessionStorage.setItem(
                     "montte:pending-ofx-import",
                     JSON.stringify({
                        content,
                        filename: file.name,
                        timestamp: Date.now(),
                     }),
                  );

                  navigate({
                     params: { slug: orgSlug },
                     to: "/$slug/import-ofx",
                  });
               },
            );
         } else {
            navigate({
               params: { slug: orgSlug },
               to: "/$slug/import-ofx",
            });
         }
      }

      handleLaunch();
   }, [navigate]);

   return (
      <div className="flex h-screen items-center justify-center bg-background">
         <Loader2 className="size-8 animate-spin text-primary" />
      </div>
   );
}
