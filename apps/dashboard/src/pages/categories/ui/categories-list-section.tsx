import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Card,
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
import { useSuspenseQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Filter, Inbox, MoreVertical, Search } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";
import { CategoryFilterSheet } from "../features/category-filter-sheet";
import { DeleteCategory } from "../features/delete-category";
import { ManageCategorySheet } from "../features/manage-category-sheet";
import { useCategoryList } from "../features/category-list-context";
import type { Category } from "../ui/categories-page";

function CategoriesCardHeader() {
   return (
      <CardHeader>
         <CardTitle>
            {translate("dashboard.routes.categories.list-section.title")}
         </CardTitle>
         <CardDescription>
            {translate("dashboard.routes.categories.list-section.description")}
         </CardDescription>
      </CardHeader>
   );
}

function CategoryActionsDropdown({ category }: { category: Category }) {
   const [isOpen, setIsOpen] = useState(false);
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
                  navigate({ to: `/categories/${category.id}` });
               }}
            >
               <Eye className="size-4" />
               {translate(
                  "dashboard.routes.categories.list-section.actions.view-details",
               )}
            </DropdownMenuItem>
            <ManageCategorySheet asChild category={category} />
            <DeleteCategory category={category} />
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
            <div className="flex items-center gap-3 pt-4">
               <div className="relative flex-1 max-w-md">
                  <Skeleton className="h-10 w-full" />
               </div>
               <Skeleton className="ml-auto h-10 w-10" />
            </div>
            <div className="space-y-4 mt-4">
               {Array.from({ length: 3 }).map((_, index) => (
                  <div
                     className="flex items-center space-x-4 p-4 border rounded-lg"
                     key={`category-skeleton-${index + 1}`}
                  >
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                     </div>
                     <Skeleton className="h-8 w-8" />
                  </div>
               ))}
            </div>
         </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
         </CardFooter>
      </Card>
   );
}

function CategoriesListContent() {
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const pageSize = 5;

   const { orderBy, setOrderBy, orderDirection, setOrderDirection } =
      useCategoryList();

   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.categories.getAllPaginated.queryOptions(
         {
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            orderBy,
            orderDirection,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { categories, pagination } = paginatedData;

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

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

               {categories.length === 0 && pagination.totalCount === 0 ? (
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
                                    <div className="flex items-center gap-1">
                                       <div
                                          className="w-3 h-3 rounded-full border"
                                          style={{
                                             backgroundColor: category.color,
                                          }}
                                       />
                                       <span className="text-xs text-muted-foreground">
                                          {category.color}
                                       </span>
                                    </div>
                                 </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                 <CategoryActionsDropdown category={category} />
                              </ItemActions>
                           </Item>
                           {index !== categories.length - 1 && (
                              <ItemSeparator />
                           )}
                        </Fragment>
                     ))}
                  </ItemGroup>
               )}
            </CardContent>
            {pagination.totalPages > 1 && (
               <CardFooter>
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
                                 setCurrentPage((prev) => {
                                    const newPage = prev - 1;
                                    return newPage >= 1 ? newPage : prev;
                                 })
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
                                 setCurrentPage((prev) => {
                                    const newPage = prev + 1;
                                    return newPage <= pagination.totalPages
                                       ? newPage
                                       : prev;
                                 })
                              }
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}
         </Card>
         <CategoryFilterSheet
            isOpen={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            orderBy={orderBy}
            onOrderByChange={(value) => {
               setOrderBy(value);
               handleFilterChange();
            }}
            orderDirection={orderDirection}
            onOrderDirectionChange={(value) => {
               setOrderDirection(value);
               handleFilterChange();
            }}
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
