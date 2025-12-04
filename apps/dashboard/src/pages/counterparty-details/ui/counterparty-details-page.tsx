import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
   Building2,
   Calendar,
   Edit,
   FileText,
   Home,
   Mail,
   Phone,
   Trash2,
   User,
   Users,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { formatDate } from "@packages/utils/date";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteCounterpartyDialog } from "../../counterparties/features/delete-counterparty-dialog";
import { ManageCounterpartySheet } from "../../counterparties/features/manage-counterparty-sheet";

function getTypeIcon(type: string) {
   switch (type) {
      case "client":
         return <User className="size-5" />;
      case "supplier":
         return <Building2 className="size-5" />;
      case "both":
         return <Users className="size-5" />;
      default:
         return <User className="size-5" />;
   }
}

function getTypeVariant(type: string): "default" | "secondary" | "outline" {
   switch (type) {
      case "client":
         return "default";
      case "supplier":
         return "secondary";
      case "both":
         return "outline";
      default:
         return "default";
   }
}

function CounterpartyContent() {
   const params = useParams({ strict: false });
   const counterpartyId =
      (params as { counterpartyId?: string }).counterpartyId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   const { data: counterparty } = useSuspenseQuery(
      trpc.counterparties.getById.queryOptions({ id: counterpartyId }),
   );

   if (!counterpartyId) {
      return (
         <CounterpartyPageError
            error={new Error("Invalid counterparty ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!counterparty) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/counterparties",
      });
   };

   return (
      <main className="space-y-4">
         <DefaultHeader
            description={translate(
               "dashboard.routes.counterparties.description",
            )}
            title={counterparty.name}
         />

         <div className="flex flex-wrap items-center gap-2">
            <Badge
               className="gap-1"
               variant={getTypeVariant(counterparty.type)}
            >
               {getTypeIcon(counterparty.type)}
               {translate(
                  `dashboard.routes.counterparties.form.type.${counterparty.type}` as Parameters<
                     typeof translate
                  >[0],
               )}
            </Badge>
            <Button
               onClick={() => setIsEditOpen(true)}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               {translate(
                  "dashboard.routes.counterparties.list-section.actions.edit-counterparty",
               )}
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteOpen(true)}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               {translate(
                  "dashboard.routes.counterparties.list-section.actions.delete-counterparty",
               )}
            </Button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
               <CardHeader>
                  <CardTitle>
                     {translate(
                        "dashboard.routes.counterparties.form.name.label",
                     )}
                  </CardTitle>
                  <CardDescription>Informações de contato</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  {counterparty.email && (
                     <div className="flex items-center gap-3">
                        <Mail className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.counterparties.form.email.label",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {counterparty.email}
                           </p>
                        </div>
                     </div>
                  )}
                  {counterparty.phone && (
                     <div className="flex items-center gap-3">
                        <Phone className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.counterparties.form.phone.label",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {counterparty.phone}
                           </p>
                        </div>
                     </div>
                  )}
                  {counterparty.document && (
                     <div className="flex items-center gap-3">
                        <User className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.counterparties.form.document.label",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {counterparty.document}
                           </p>
                        </div>
                     </div>
                  )}
                  <div className="flex items-center gap-3">
                     <Calendar className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.counterparties.table.columns.created-at",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {formatDate(
                              new Date(counterparty.createdAt),
                              "DD MMM YYYY",
                           )}
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {counterparty.notes && (
               <Card>
                  <CardHeader>
                     <CardTitle>
                        {translate(
                           "dashboard.routes.counterparties.form.notes.label",
                        )}
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {counterparty.notes}
                     </p>
                  </CardContent>
               </Card>
            )}
         </div>

         <ManageCounterpartySheet
            counterparty={counterparty}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteCounterpartyDialog
            counterparty={counterparty}
            onSuccess={handleDeleteSuccess}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
         />
      </main>
   );
}

function CounterpartyPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
         </div>
      </main>
   );
}

function CounterpartyPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate(
                        "dashboard.routes.counterparties.list-section.state.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/counterparties",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        {translate("dashboard.routes.counterparties.title")}
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function CounterpartyDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={CounterpartyPageError}>
         <Suspense fallback={<CounterpartyPageSkeleton />}>
            <CounterpartyContent />
         </Suspense>
      </ErrorBoundary>
   );
}
