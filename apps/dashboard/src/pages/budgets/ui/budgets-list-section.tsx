import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
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
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Eye, Filter, Inbox, MoreVertical, Plus, Search } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc } from "@/integrations/clients";
import { BudgetFilterSheet } from "../features/budget-filter-sheet";
import { useBudgetList } from "../features/budget-list-context";
import { DeleteBudget } from "../features/delete-budget";
import { ManageBudgetSheet } from "../features/manage-budget-sheet";
import { BudgetProgressBar } from "./budget-progress-bar";
import type { Budget } from "./budgets-page";

function BudgetsCardHeader() {
   const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);
   const isMobile = useIsMobile();

   return (
      <>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.budgets.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.budgets.list-section.description")}
            </CardDescription>
            {!isMobile && (
               <CardAction>
                  <Button onClick={() => setIsBudgetSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.budgets.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               </CardAction>
            )}
         </CardHeader>
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsBudgetSheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>
         <ManageBudgetSheet
            onOpen={isBudgetSheetOpen}
            onOpenChange={setIsBudgetSheetOpen}
         />
      </>
   );
}

function BudgetActionsDropdown({ budget }: { budget: Budget }) {
   const [isOpen, setIsOpen] = useState(false);
   const { activeOrganization } = useActiveOrganization();

   return (
      <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
         <Tooltip>
            <TooltipTrigger asChild>
               <DropdownMenuTrigger asChild>
                  <Button
                     aria-label={translate(
                        "dashboard.routes.budgets.list-section.actions.label",
                     )}
                     className="h-8 w-8 p-0"
                     size="icon"
                     title="Budget actions"
                     variant="ghost"
                  >
                     <MoreVertical className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.budgets.list-section.actions.label",
               )}
            </TooltipContent>
         </Tooltip>
         <DropdownMenuContent align="end">
            <DropdownMenuLabel>
               {translate(
                  "dashboard.routes.budgets.list-section.actions.label",
               )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
               <Link
                  params={{
                     budgetId: budget.id,
                     slug: activeOrganization.slug,
                  }}
                  to="/$slug/budgets/$budgetId"
               >
                  <Eye className="size-4" />
                  {translate(
                     "dashboard.routes.budgets.list-section.actions.view-details",
                  )}
               </Link>
            </DropdownMenuItem>
            <ManageBudgetSheet asChild budget={budget} />
            <DeleteBudget asDropdownItem budget={budget} />
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

function BudgetsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <BudgetsCardHeader />
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.budgets.list-section.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.budgets.list-section.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function BudgetsListSkeleton() {
   return (
      <Card>
         <BudgetsCardHeader />
         <CardContent>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`budget-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia variant="icon">
                           <Skeleton className="size-10 rounded-lg" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                           <Skeleton className="h-3 w-full mt-2" />
                        </ItemContent>
                        <ItemActions>
                           <Skeleton className="size-8" />
                        </ItemActions>
                     </Item>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
         </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
         </CardFooter>
      </Card>
   );
}

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
   }).format(value);
}

function BudgetItem({ budget }: { budget: Budget }) {
   const totalAmount = parseFloat(budget.amount);
   const currentPeriod = budget.periods?.[0];
   const spent = currentPeriod
      ? parseFloat(currentPeriod.spentAmount || "0")
      : 0;
   const scheduled = currentPeriod
      ? parseFloat(currentPeriod.scheduledAmount || "0")
      : 0;
   const available = Math.max(0, totalAmount - spent - scheduled);
   const percentage = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;
   const forecastPercentage =
      totalAmount > 0 ? ((spent + scheduled) / totalAmount) * 100 : 0;

   const periodLabels: Record<string, string> = {
      custom: translate("dashboard.routes.budgets.form.period.custom"),
      daily: translate("dashboard.routes.budgets.form.period.daily"),
      monthly: translate("dashboard.routes.budgets.form.period.monthly"),
      quarterly: translate("dashboard.routes.budgets.form.period.quarterly"),
      weekly: translate("dashboard.routes.budgets.form.period.weekly"),
      yearly: translate("dashboard.routes.budgets.form.period.yearly"),
   };

   return (
      <Item className="flex-col items-start gap-3 py-4">
         <div className="flex w-full items-start gap-3">
            <ItemMedia variant="icon">
               <div
                  className="size-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: budget.color || "#6366f1" }}
               >
                  {budget.name.substring(0, 2).toUpperCase()}
               </div>
            </ItemMedia>
            <ItemContent className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <ItemTitle className="truncate">{budget.name}</ItemTitle>
                  <span className="text-sm font-medium text-muted-foreground ml-2">
                     {formatCurrency(totalAmount)}
                  </span>
               </div>
               <ItemDescription className="flex items-center gap-2">
                  <span>{periodLabels[budget.periodType]}</span>
                  {budget.mode === "business" && (
                     <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {translate(
                           "dashboard.routes.budgets.form.mode.business",
                        )}
                     </span>
                  )}
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <BudgetActionsDropdown budget={budget} />
            </ItemActions>
         </div>
         <div className="w-full pl-13">
            <BudgetProgressBar
               available={available}
               forecastPercentage={forecastPercentage}
               percentage={percentage}
               scheduled={scheduled}
               showLabels
               spent={spent}
               total={totalAmount}
            />
         </div>
      </Item>
   );
}

function BudgetsListContent() {
   const {
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,
      setIsFilterSheetOpen,
      isFilterSheetOpen,
      modeFilter,
      setModeFilter,
      activeFilter,
      setActiveFilter,
   } = useBudgetList();

   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm, setCurrentPage]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.budgets.getAllPaginated.queryOptions(
         {
            isActive: activeFilter,
            limit: pageSize,
            mode: modeFilter,
            orderBy,
            orderDirection,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { budgets, pagination } = paginatedData;
   const { totalPages } = pagination;

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      orderBy !== "name" ||
      orderDirection !== "asc" ||
      modeFilter !== undefined ||
      activeFilter !== undefined;

   return (
      <>
         <Card>
            <BudgetsCardHeader />
            <CardContent className="grid gap-2">
               <div className="flex items-center justify-between gap-8">
                  <InputGroup>
                     <InputGroupInput
                        onChange={(e) => {
                           setSearchTerm(e.target.value);
                        }}
                        placeholder={translate(
                           "common.form.search.placeholder",
                        )}
                        value={searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={() => setIsFilterSheetOpen(true)}
                           size="icon"
                           variant={hasActiveFilters ? "default" : "outline"}
                        >
                           <Filter className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        {translate(
                           "dashboard.routes.budgets.features.filter.title",
                        )}
                     </TooltipContent>
                  </Tooltip>
               </div>

               {budgets.length === 0 && pagination.totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.budgets.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.budgets.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <ItemGroup>
                     {budgets.map((budget, index) => (
                        <Fragment key={budget.id}>
                           <BudgetItem budget={budget} />
                           {index !== budgets.length - 1 && <ItemSeparator />}
                        </Fragment>
                     ))}
                  </ItemGroup>
               )}
            </CardContent>

            {pagination.totalPages > 1 && (
               <CardFooter className="block md:hidden">
                  <Pagination>
                     <PaginationContent>
                        <PaginationItem>
                           <PaginationPrevious
                              className={
                                 !pagination.hasPreviousPage
                                    ? "pointer-events-none opacity-50"
                                    : ""
                              }
                              href="#"
                              onClick={() =>
                                 setCurrentPage(Math.max(1, currentPage - 1))
                              }
                           />
                        </PaginationItem>

                        {Array.from(
                           { length: Math.min(5, pagination.totalPages) },
                           (_, i: number): number => {
                              if (pagination.totalPages <= 5) {
                                 return i + 1;
                              }
                              if (currentPage <= 3) {
                                 return i + 1;
                              }
                              if (currentPage >= pagination.totalPages - 2) {
                                 return pagination.totalPages - 4 + i;
                              }
                              return currentPage - 2 + i;
                           },
                        ).map((pageNum) => (
                           <PaginationItem key={pageNum}>
                              <PaginationLink
                                 isActive={pageNum === currentPage}
                                 onClick={() => setCurrentPage(pageNum)}
                              >
                                 {pageNum}
                              </PaginationLink>
                           </PaginationItem>
                        ))}

                        <PaginationItem>
                           <PaginationNext
                              className={
                                 !pagination.hasNextPage
                                    ? "pointer-events-none opacity-50"
                                    : ""
                              }
                              onClick={() =>
                                 setCurrentPage(
                                    Math.min(
                                       pagination.totalPages,
                                       currentPage + 1,
                                    ),
                                 )
                              }
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}

            {pagination.totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     Mostrando {budgets.length} de {pagination.totalCount}{" "}
                     orçamentos
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                     <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {currentPage} de {totalPages}
                     </div>
                     <div className="flex items-center space-x-2">
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(1)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para primeira página
                           </span>
                           {"<<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === 1}
                           onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Página anterior</span>
                           {"<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === totalPages}
                           onClick={() =>
                              setCurrentPage(
                                 Math.min(totalPages, currentPage + 1),
                              )
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Próxima página</span>
                           {">"}
                        </Button>
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(totalPages)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para última página
                           </span>
                           {">>"}
                        </Button>
                     </div>
                  </div>
               </CardFooter>
            )}
         </Card>

         <BudgetFilterSheet
            activeFilter={activeFilter}
            isOpen={isFilterSheetOpen}
            modeFilter={modeFilter}
            onActiveFilterChange={(value) => {
               setActiveFilter(value);
               handleFilterChange();
            }}
            onModeFilterChange={(value) => {
               setModeFilter(value);
               handleFilterChange();
            }}
            onOpenChange={setIsFilterSheetOpen}
            onOrderByChange={(value) => {
               setOrderBy(value);
               handleFilterChange();
            }}
            onOrderDirectionChange={(value) => {
               setOrderDirection(value);
               handleFilterChange();
            }}
            onPageSizeChange={(value) => {
               setPageSize(value);
               handleFilterChange();
            }}
            orderBy={orderBy}
            orderDirection={orderDirection}
            pageSize={pageSize}
         />
      </>
   );
}

export function BudgetsListSection() {
   return (
      <ErrorBoundary FallbackComponent={BudgetsListErrorFallback}>
         <Suspense fallback={<BudgetsListSkeleton />}>
            <BudgetsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
