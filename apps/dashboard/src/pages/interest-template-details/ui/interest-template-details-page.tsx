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
   Calendar,
   Clock,
   Edit,
   FileText,
   Home,
   Percent,
   Star,
   Trash2,
   TrendingUp,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { formatDate } from "@packages/utils/date";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteInterestTemplateDialog } from "../../interest-templates/features/delete-interest-template-dialog";
import { ManageInterestTemplateSheet } from "../../interest-templates/features/manage-interest-template-sheet";

function getPenaltyTypeLabel(type: string) {
   switch (type) {
      case "percentage":
         return translate(
            "dashboard.routes.interest-templates.form.penalty-type.percentage",
         );
      case "fixed":
         return translate(
            "dashboard.routes.interest-templates.form.penalty-type.fixed",
         );
      default:
         return translate(
            "dashboard.routes.interest-templates.form.penalty-type.none",
         );
   }
}

function getInterestTypeLabel(type: string) {
   switch (type) {
      case "daily":
         return translate(
            "dashboard.routes.interest-templates.form.interest-type.daily",
         );
      case "monthly":
         return translate(
            "dashboard.routes.interest-templates.form.interest-type.monthly",
         );
      default:
         return translate(
            "dashboard.routes.interest-templates.form.interest-type.none",
         );
   }
}

function InterestTemplateContent() {
   const params = useParams({ strict: false });
   const interestTemplateId =
      (params as { interestTemplateId?: string }).interestTemplateId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   const { data: template } = useSuspenseQuery(
      trpc.interestTemplates.getById.queryOptions({ id: interestTemplateId }),
   );

   if (!interestTemplateId) {
      return (
         <InterestTemplatePageError
            error={new Error("Invalid interest template ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!template) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/interest-templates",
      });
   };

   return (
      <main className="space-y-4">
         <DefaultHeader
            description={translate(
               "dashboard.routes.interest-templates.description",
            )}
            title={template.name}
         />

         <div className="flex flex-wrap items-center gap-2">
            {template.isDefault && (
               <Badge className="gap-1" variant="default">
                  <Star className="size-4 fill-current" />
                  {translate(
                     "dashboard.routes.interest-templates.form.is-default.label",
                  )}
               </Badge>
            )}
            {template.monetaryCorrectionIndex !== "none" && (
               <Badge variant="secondary">
                  {template.monetaryCorrectionIndex.toUpperCase()}
               </Badge>
            )}
            <Button
               onClick={() => setIsEditOpen(true)}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               {translate(
                  "dashboard.routes.interest-templates.list-section.actions.edit-template",
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
                  "dashboard.routes.interest-templates.list-section.actions.delete-template",
               )}
            </Button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
               <CardHeader>
                  <CardTitle>
                     {translate(
                        "dashboard.routes.interest-templates.form.penalty-type.label",
                     )}
                  </CardTitle>
                  <CardDescription>Configuracao de multa</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Percent className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.interest-templates.form.penalty-type.label",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {getPenaltyTypeLabel(template.penaltyType)}
                        </p>
                     </div>
                  </div>
                  {template.penaltyValue && (
                     <div className="flex items-center gap-3">
                        <Percent className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.interest-templates.form.penalty-value.label",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {template.penaltyValue}
                              {template.penaltyType === "percentage"
                                 ? "%"
                                 : " R$"}
                           </p>
                        </div>
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle>
                     {translate(
                        "dashboard.routes.interest-templates.form.interest-type.label",
                     )}
                  </CardTitle>
                  <CardDescription>Configuracao de juros</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                     <TrendingUp className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.interest-templates.form.interest-type.label",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {getInterestTypeLabel(template.interestType)}
                        </p>
                     </div>
                  </div>
                  {template.interestValue && (
                     <div className="flex items-center gap-3">
                        <TrendingUp className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.interest-templates.form.interest-value.label",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {template.interestValue}%
                           </p>
                        </div>
                     </div>
                  )}
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle>Outras Configuracoes</CardTitle>
                  <CardDescription>
                     Carencia e correcao monetaria
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Clock className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.interest-templates.form.grace-period.label",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {template.gracePeriodDays}{" "}
                           {translate(
                              "dashboard.routes.interest-templates.form.grace-period.days",
                           )}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <TrendingUp className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.interest-templates.form.monetary-correction.label",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {template.monetaryCorrectionIndex !== "none"
                              ? template.monetaryCorrectionIndex.toUpperCase()
                              : translate(
                                   "dashboard.routes.interest-templates.form.monetary-correction.none",
                                )}
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle>Informacoes</CardTitle>
                  <CardDescription>Datas e metadados</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                     <Calendar className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.interest-templates.table.columns.created-at",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {formatDate(
                              new Date(template.createdAt),
                              "DD MMM YYYY",
                           )}
                        </p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>

         <ManageInterestTemplateSheet
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
            template={template}
         />
         <DeleteInterestTemplateDialog
            onSuccess={handleDeleteSuccess}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
            template={template}
         />
      </main>
   );
}

function InterestTemplatePageSkeleton() {
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
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
         </div>
      </main>
   );
}

function InterestTemplatePageError({
   error,
   resetErrorBoundary,
}: FallbackProps) {
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
                        "dashboard.routes.interest-templates.list-section.state.error.title",
                     )}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/interest-templates",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        {translate("dashboard.routes.interest-templates.title")}
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

export function InterestTemplateDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={InterestTemplatePageError}>
         <Suspense fallback={<InterestTemplatePageSkeleton />}>
            <InterestTemplateContent />
         </Suspense>
      </ErrorBoundary>
   );
}
