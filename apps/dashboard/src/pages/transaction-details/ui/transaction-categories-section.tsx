import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building, FolderOpen, Split, Tag } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function CategorizationErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            {translate(
               "dashboard.routes.transactions.details.error.load-categories",
            )}
         </AlertDescription>
      </Alert>
   );
}

function CategorizationSkeleton() {
   return (
      <Card>
         <CardHeader className="pb-2">
            <Skeleton className="h-5 w-32" />
         </CardHeader>
         <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
         </CardContent>
      </Card>
   );
}

type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

function CategorizationContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();
   const slug = activeOrganization.slug;

   const { data } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const categories = data.transactionCategories || [];
   const tags = data.transactionTags || [];
   const costCenter = data.costCenter;
   const categorySplits = data.categorySplits as CategorySplit[] | null;
   const hasSplit = categorySplits && categorySplits.length > 0;
   const totalAmount = Math.abs(parseFloat(data.amount)) * 100;

   const hasCategories = categories.length > 0;
   const hasTags = tags.length > 0;
   const hasCostCenter = !!costCenter;
   const hasCategorization = hasCategories || hasTags || hasCostCenter;

   if (!hasCategorization) {
      return (
         <Card>
            <CardHeader className="pb-2">
               <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="size-4" />
                  Categorização
               </CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground text-sm">
                  Nenhuma categorização definida. Use o botão "Categorizar" para
                  adicionar categorias, tags ou centro de custo.
               </p>
            </CardContent>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
               <FolderOpen className="size-4" />
               Categorização
            </CardTitle>
         </CardHeader>
         <CardContent className="p-0">
            <ItemGroup>
               {hasCategories && (
                  <>
                     <div className="px-4 md:px-6 py-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                           <Tag className="size-3.5 text-muted-foreground" />
                           <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {translate(
                                 "dashboard.routes.transactions.details.categories.title",
                              )}
                           </span>
                           {hasSplit && (
                              <Badge
                                 className="gap-1 text-[10px] h-5"
                                 variant="secondary"
                              >
                                 <Split className="size-2.5" />
                                 Dividido em {categories.length}
                              </Badge>
                           )}
                        </div>
                     </div>
                     <div className="px-4 md:px-6 py-3 space-y-2">
                        {categories.map(({ category }, index) => {
                           const split = categorySplits?.find(
                              (s) => s.categoryId === category.id,
                           );
                           const splitValue = split?.value || 0;
                           const percentage = hasSplit
                              ? Math.round((splitValue / totalAmount) * 100)
                              : 0;

                           return (
                              <div key={category.id}>
                                 <Item
                                    className="p-0 gap-3"
                                    size="sm"
                                    variant="default"
                                 >
                                    <ItemMedia
                                       className="size-8 rounded-md"
                                       style={{
                                          backgroundColor: category.color,
                                       }}
                                    >
                                       <IconDisplay
                                          className="text-white"
                                          iconName={
                                             (category.icon ||
                                                "Tag") as IconName
                                          }
                                          size={14}
                                       />
                                    </ItemMedia>
                                    <ItemContent className="gap-1.5">
                                       <div className="flex items-center justify-between">
                                          <ItemTitle className="text-sm">
                                             {category.name}
                                          </ItemTitle>
                                          {hasSplit && (
                                             <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                   {percentage}%
                                                </span>
                                                <span className="text-sm font-medium tabular-nums">
                                                   {formatDecimalCurrency(
                                                      splitValue / 100,
                                                   )}
                                                </span>
                                             </div>
                                          )}
                                       </div>
                                       {hasSplit && (
                                          <Progress
                                             className="h-1.5"
                                             style={
                                                {
                                                   "--progress-background":
                                                      category.color,
                                                } as React.CSSProperties
                                             }
                                             value={percentage}
                                          />
                                       )}
                                    </ItemContent>
                                 </Item>
                                 {index < categories.length - 1 && (
                                    <ItemSeparator className="my-2 opacity-50" />
                                 )}
                              </div>
                           );
                        })}
                        {hasSplit && (
                           <div className="flex items-center justify-between pt-2 mt-2 border-t">
                              <span className="text-xs font-medium text-muted-foreground">
                                 {translate(
                                    "dashboard.routes.transactions.details.categories.total",
                                 )}
                              </span>
                              <span className="font-semibold text-sm tabular-nums">
                                 {formatDecimalCurrency(totalAmount / 100)}
                              </span>
                           </div>
                        )}
                     </div>
                  </>
               )}

               {hasTags && (
                  <>
                     {hasCategories && <ItemSeparator />}
                     <div className="px-4 md:px-6 py-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                           <Tag className="size-3.5 text-muted-foreground" />
                           <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Tags
                           </span>
                           <Badge
                              className="text-[10px] h-5"
                              variant="secondary"
                           >
                              {tags.length}
                           </Badge>
                        </div>
                     </div>
                     <div className="px-4 md:px-6 py-3">
                        <div className="flex flex-wrap gap-1.5">
                           {tags.map((transactionTag) => (
                              <Link
                                 key={transactionTag.tag.id}
                                 params={{ slug, tagId: transactionTag.tag.id }}
                                 to="/$slug/tags/$tagId"
                              >
                                 <Badge
                                    className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                                    style={{
                                       backgroundColor:
                                          transactionTag.tag.color,
                                    }}
                                 >
                                    {transactionTag.tag.name}
                                 </Badge>
                              </Link>
                           ))}
                        </div>
                     </div>
                  </>
               )}

               {hasCostCenter && (
                  <>
                     {(hasCategories || hasTags) && <ItemSeparator />}
                     <div className="px-4 md:px-6 py-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                           <Building className="size-3.5 text-muted-foreground" />
                           <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Centro de Custo
                           </span>
                        </div>
                     </div>
                     <div className="px-4 md:px-6 py-3">
                        <Item className="p-0 gap-3" size="sm" variant="default">
                           <ItemMedia
                              className="size-8 rounded-md bg-primary/10"
                              variant="icon"
                           >
                              <Building className="size-4 text-primary" />
                           </ItemMedia>
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 {costCenter.name}
                              </ItemTitle>
                              {costCenter.code && (
                                 <ItemDescription className="text-xs">
                                    Código: {costCenter.code}
                                 </ItemDescription>
                              )}
                           </ItemContent>
                        </Item>
                     </div>
                  </>
               )}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

export function TransactionCategorizationSection({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={CategorizationErrorFallback}>
         <Suspense fallback={<CategorizationSkeleton />}>
            <CategorizationContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
