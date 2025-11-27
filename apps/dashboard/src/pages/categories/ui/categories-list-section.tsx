import { translate } from "@packages/localization";
import { formatDate } from "@packages/utils/date";
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
import { DataTable } from "@packages/ui/components/data-table";
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
import { useNavigate } from "@tanstack/react-router";
import {
   Eye,
   Filter,
   Inbox,
   MoreVertical,
   Plus,
   Search,
   Trash2,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc } from "@/integrations/clients";
import { CategoryFilterSheet } from "../features/category-filter-sheet";
import { useCategoryList } from "../features/category-list-context";
import { DeleteCategory } from "../features/delete-category";
import { ManageCategorySheet } from "../features/manage-category-sheet";
import type { Category } from "../ui/categories-page";
import { createCategoryColumns } from "./categories-table-columns";

function CategoriesCardHeader() {
   const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

   const isMobile = useIsMobile();
   return (
      <>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.categories.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.categories.list-section.description",
               )}
            </CardDescription>
            {!isMobile && (
               <CardAction>
                  <Button
                     onClick={() => setIsCategorySheetOpen(true)}
                     size="sm"
                  >
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.categories.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               </CardAction>
            )}
         </CardHeader>
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsCategorySheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>
         <ManageCategorySheet
            onOpen={isCategorySheetOpen}
            onOpenChange={setIsCategorySheetOpen}
         />
      </>
   );
}

function CategoryActionsDropdown({ category }: { category: Category }) {
   const [isOpen, setIsOpen] = useState(false);
   const { activeOrganization } = useActiveOrganization();
   const navigate = useNavigate();

   return (
      <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
         <Tooltip>
            <TooltipTrigger asChild>
               <DropdownMenuTrigger asChild>
                  <Button
                     aria-label={translate(
                        "dashboard.routes.categories.list-section.actions.label",
                     )}
                     className="h-8 w-8 p-0"
                     size="icon"
                     title="Category actions"
                     variant="ghost"
                  >
                     <MoreVertical className="h-4 w-4" />
                  </Button>
               </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.categories.list-section.actions.label",
               )}
            </TooltipContent>
         </Tooltip>
         <DropdownMenuContent align="end">
            <DropdownMenuLabel>
               {translate(
                  "dashboard.routes.categories.list-section.actions.label",
               )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
               className="flex items-center gap-2"
               onClick={() => {
                  navigate({
                     params: {
                        categoryId: category.id,
                        slug: activeOrganization.slug,
                     },
                     to: "/$slug/categories/$categoryId" as const,
                  } as never);
               }}
            >
               <Eye className="size-4" />
               {translate(
                  "dashboard.routes.categories.list-section.actions.view-details",
               )}
            </DropdownMenuItem>
            <ManageCategorySheet asChild category={category} />
            <DeleteCategory category={category}>
               <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
               >
                  <Trash2 className="size-4 " />
                  {translate(
                     "dashboard.routes.categories.list-section.actions.delete",
                  )}
               </DropdownMenuItem>
            </DeleteCategory>
         </DropdownMenuContent>
      </DropdownMenu>
   );
}

function CategoriesListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CategoriesCardHeader />
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.categories.list-section.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.categories.list-section.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function CategoriesListSkeleton() {
   return (
      <Card>
         <CategoriesCardHeader />
         <CardContent>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`category-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia variant="icon">
                           <div className="size-8 rounded-sm border group relative">
                              <Skeleton className="size-8 rounded-sm" />
                           </div>
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
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

function CategoriesListContent() {
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
   } = useCategoryList();

   const { activeOrganization } = useActiveOrganization();
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
      trpc.categories.getAllPaginated.queryOptions(
         {
            limit: pageSize,
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

   const { categories, pagination } = paginatedData;
   const { totalPages } = pagination;

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const isMobile = useIsMobile();
   const hasActiveFilters = orderBy !== "name" || orderDirection !== "asc";

   return (
      <>
         <Card>
            <CategoriesCardHeader />
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
                        <p>Filter categories</p>
                     </TooltipContent>
                  </Tooltip>
               </div>

               {isMobile ? (
                  categories.length === 0 && pagination.totalCount === 0 ? (
                     <Empty>
                        <EmptyContent>
                           <EmptyMedia variant="icon">
                              <Inbox className="size-6" />
                           </EmptyMedia>
                           <EmptyTitle>
                              {translate(
                                 "dashboard.routes.categories.list-section.state.empty.title",
                              )}
                           </EmptyTitle>
                           <EmptyDescription>
                              {translate(
                                 "dashboard.routes.categories.list-section.state.empty.description",
                              )}
                           </EmptyDescription>
                        </EmptyContent>
                     </Empty>
                  ) : (
                     <ItemGroup>
                        {categories.map((category, index) => (
                           <Fragment key={category.id}>
                              <Item>
                                 <ItemMedia variant="icon">
                                    <div
                                       className="size-8 rounded-sm border flex items-center justify-center"
                                       style={{
                                          backgroundColor: category.color,
                                       }}
                                    >
                                       <IconDisplay
                                          className="text-white"
                                          iconName={
                                             (category.icon ||
                                                "Wallet") as IconName
                                          }
                                          size={16}
                                       />
                                    </div>
                                 </ItemMedia>
                                 <ItemContent>
                                    <ItemTitle>{category.name}</ItemTitle>
                                    <ItemDescription>
                                       <span className="text-xs text-muted-foreground">
                                          {formatDate(
                                             new Date(category.createdAt),
                                             "DD/MM/YYYY",
                                          )}
                                       </span>
                                    </ItemDescription>
                                 </ItemContent>
                                 <ItemActions>
                                    <CategoryActionsDropdown
                                       category={category}
                                    />
                                 </ItemActions>
                              </Item>
                              {index !== categories.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  )
               ) : categories.length === 0 && pagination.totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.categories.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.categories.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createCategoryColumns(activeOrganization.slug)}
                     data={categories}
                  />
               )}
            </CardContent>

            {/* Pagination Mobile */}
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
                              } else if (currentPage <= 3) {
                                 return i + 1;
                              } else if (
                                 currentPage >=
                                 pagination.totalPages - 2
                              ) {
                                 return pagination.totalPages - 4 + i;
                              } else {
                                 return currentPage - 2 + i;
                              }
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

            {/* Pagination Desktop */}
            {pagination.totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     Mostrando {categories.length} de {pagination.totalCount}{" "}
                     categorias
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

         {/* Mobile Floating Action Button */}

         <CategoryFilterSheet
            isOpen={isFilterSheetOpen}
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

export function CategoriesListSection() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesListErrorFallback}>
         <Suspense fallback={<CategoriesListSkeleton />}>
            <CategoriesListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
