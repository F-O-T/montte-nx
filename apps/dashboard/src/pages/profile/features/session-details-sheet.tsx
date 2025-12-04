import { translate } from "@packages/localization";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@packages/ui/components/alert-dialog";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Separator } from "@packages/ui/components/separator";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
} from "@packages/ui/components/sheet";
import { toast } from "@packages/ui/components/sonner";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Info, Monitor, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { Session } from "@/integrations/clients";
import { useTRPC } from "@/integrations/clients";

interface SessionDetailsSheetProps {
   session: Session["session"];
   currentSessionId: string | null;
}

export function SessionDetailsSheet({
   session,
   currentSessionId,
}: SessionDetailsSheetProps) {
   const trpc = useTRPC();

   const revokeSessionMutation = useMutation(
      trpc.session.revokeSessionByToken.mutationOptions({
         onSuccess: () => {
            toast.success("Session revoked");
         },
      }),
   );

   const handleDelete = useCallback(async () => {
      await revokeSessionMutation.mutateAsync({
         token: session.token,
      });
   }, [session, revokeSessionMutation]);

   const sessionDetails = useMemo(() => {
      return [
         {
            isCurrent: session.id === currentSessionId,
            showIcon: false,
            title: translate("dashboard.routes.profile.sessions.item.device"),
            value:
               session.userAgent ||
               translate(
                  "dashboard.routes.profile.sessions.item.unknown-device",
               ),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.ip-address",
            ),
            value: session.ipAddress || "-",
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.created-at",
            ),
            value: formatDate(session.createdAt),
         },
         {
            isCurrent: false,
            showIcon: false,
            title: translate(
               "dashboard.routes.profile.sessions.item.last-active",
            ),
            value: formatDate(session.updatedAt),
         },
      ];
   }, [session, currentSessionId]);

   return (
      <TooltipProvider>
         <Sheet>
            <Tooltip>
               <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                     <Button
                        aria-label={translate(
                           "dashboard.routes.profile.sessions.item.details",
                        )}
                        size="icon"
                        variant="ghost"
                     >
                        <Info className="w-4 h-4" />
                     </Button>
                  </SheetTrigger>
               </TooltipTrigger>
               <TooltipContent>
                  {translate("dashboard.routes.profile.sessions.item.details")}
               </TooltipContent>
            </Tooltip>
            <SheetContent>
               <SheetHeader>
                  <SheetTitle>
                     {translate(
                        "dashboard.routes.profile.features.session-details.title",
                     )}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "dashboard.routes.profile.features.session-details.description",
                     )}
                  </SheetDescription>
               </SheetHeader>
               <ItemGroup>
                  {sessionDetails.map((detail, index) => (
                     <Item key={detail.title}>
                        {detail.showIcon && (
                           <ItemMedia variant="icon">
                              <Monitor className="size-4" />
                           </ItemMedia>
                        )}
                        <ItemContent>
                           <ItemTitle>
                              {detail.title}
                              {detail.isCurrent && (
                                 <Badge>
                                    <CheckCircle2 className="w-4 h-4" />
                                    {translate(
                                       "dashboard.routes.profile.sessions.item.current",
                                    )}
                                 </Badge>
                              )}
                           </ItemTitle>
                           <ItemDescription>{detail.value}</ItemDescription>
                        </ItemContent>
                        {index < sessionDetails.length - 1 && <ItemSeparator />}
                     </Item>
                  ))}
               </ItemGroup>
               <Separator />
               <SheetHeader>
                  <SheetTitle>
                     {translate(
                        "dashboard.routes.profile.features.session-details.actions.title",
                     )}
                  </SheetTitle>
                  <SheetDescription>
                     {translate(
                        "dashboard.routes.profile.features.session-details.actions.description",
                     )}
                  </SheetDescription>
               </SheetHeader>
               <ItemGroup className="px-4">
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                        <Item
                           aria-label={translate(
                              "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
                           )}
                           className="cursor-pointer"
                           variant="outline"
                        >
                           <ItemMedia variant="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                           </ItemMedia>
                           <ItemContent className="gap-1">
                              <ItemTitle className="text-destructive">
                                 {translate(
                                    "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
                                 )}
                              </ItemTitle>
                              <ItemDescription>
                                 {translate(
                                    "dashboard.routes.profile.features.session-details.actions.revoke-current.description",
                                 )}
                              </ItemDescription>
                           </ItemContent>
                           <ItemActions>
                              <ArrowRight className="size-4 text-destructive" />
                           </ItemActions>
                        </Item>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                           <AlertDialogTitle>
                              {translate(
                                 "common.headers.delete-confirmation.title",
                              )}
                           </AlertDialogTitle>
                           <AlertDialogDescription>
                              {translate(
                                 "common.headers.delete-confirmation.description",
                              )}
                           </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                           <AlertDialogCancel>
                              {translate("common.actions.cancel")}
                           </AlertDialogCancel>
                           <AlertDialogAction onClick={handleDelete}>
                              {translate(
                                 "dashboard.routes.profile.features.session-details.actions.revoke-current.title",
                              )}
                           </AlertDialogAction>
                        </AlertDialogFooter>
                     </AlertDialogContent>
                  </AlertDialog>
               </ItemGroup>
            </SheetContent>
         </Sheet>
      </TooltipProvider>
   );
}
