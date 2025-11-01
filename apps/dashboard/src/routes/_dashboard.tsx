import { ContentaChat } from "@contentagen/assistant-widget";
import i18n, { type SupportedLng } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { betterAuthClient } from "@/integrations/clients";
import { DashboardLayout } from "@/layout/dashboard-layout";

export const Route = createFileRoute("/_dashboard")({
   component: RouteComponent,
   wrapInSuspense: true,
});

function RouteComponent() {
   const location = useLocation();
   const session = betterAuthClient.useSession();
   return (
      <DashboardLayout session={session.data}>
         <div
            className="duration-700 animate-in slide-in-from-bottom-4 fade-in h-full w-full"
            key={location.pathname}
         >
            <Popover>
               <PopoverTrigger asChild>
                  <Button
                     className="fixed bottom-4 right-4 z-50"
                     size="icon"
                     variant={"outline"}
                  >
                     <MessageCircle className="h-6 w-6" />
                  </Button>
               </PopoverTrigger>
               <PopoverContent align="end" className="w-full p-0">
                  <ContentaChat
                     locale={i18n.language as SupportedLng}
                     sendMessage={() => {}}
                  />
               </PopoverContent>
            </Popover>

            <Outlet />
         </div>
      </DashboardLayout>
   );
}
