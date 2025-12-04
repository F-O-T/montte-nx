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
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import { Card, CardContent } from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
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
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   SelectionActionBar,
   SelectionActionButton,
} from "@packages/ui/components/selection-action-bar";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import {
   ArrowDownAZ,
   ArrowUpAZ,
   Filter,
   Inbox,
   Search,
   Trash2,
   X,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc } from "@/integrations/clients";
import { TagFilterSheet } from "../features/tag-filter-sheet";
import { useTagList } from "../features/tag-list-context";
import { useTagBulkActions } from "../features/use-tag-bulk-actions";
import {
   createTagColumns,
   TagExpandedContent,
   TagMobileCard,
} from "./tags-table-columns";

function TagsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardContent className="pt-6">
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.tags.list-section.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.tags.list-section.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function TagsListSkeleton() {
   return (
      <Card>
         <CardContent className="pt-6 grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
               <Skeleton className="h-9 w-full sm:max-w-md" />
               <Skeleton className="h-9 w-9" />
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
            </div>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`tag-skeleton-${index + 1}`}>
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-sm" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                     </div>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
            <div className="flex items-center justify-end gap-2 pt-4">
               <Skeleton className="h-10 w-24" />
               <Skeleton className="h-10 w-10" />
               <Skeleton className="h-10 w-24" />
            </div>
         </CardContent>
      </Card>
   );
}

function TagsListContent() {
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
   } = useTagList();

   const { activeOrganization } = useActiveOrganization();
   const isMobile = useIsMobile();
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm, setCurrentPage]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.tags.getAllPaginated.queryOptions(
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

   const { tags, pagination } = paginatedData;
   const { totalPages, totalCount } = pagination;

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      debouncedSearchTerm || orderBy !== "name" || orderDirection !== "asc";

   const selectedIds = Object.keys(rowSelection).filter(
      (id) => rowSelection[id],
   );

   const { deleteSelected, isLoading } = useTagBulkActions({
      onSuccess: () => {
         setRowSelection({});
         setIsDeleteDialogOpen(false);
      },
   });

   const handleClearSelection = () => {
      setRowSelection({});
   };

   const handleClearFilters = () => {
      setSearchTerm("");
      setOrderBy("name");
      setOrderDirection("asc");
   };

   return (
      <>
         <Card>
            <CardContent className="pt-6 grid gap-4">
               <div className="flex gap-6">
                  <InputGroup className="flex-1 sm:max-w-md">
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

                  {isMobile && (
                     <Button
                        onClick={() => setIsFilterSheetOpen(true)}
                        size="icon"
                        variant="outline"
                     >
                        <Filter className="size-4" />
                     </Button>
                  )}
               </div>

               {!isMobile && (
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                           {translate("common.form.sort-by.label")}:
                        </span>
                        <ToggleGroup
                           onValueChange={(value) => {
                              if (value) {
                                 setOrderDirection(value as "asc" | "desc");
                                 handleFilterChange();
                              }
                           }}
                           size="sm"
                           spacing={2}
                           type="single"
                           value={orderDirection}
                           variant="outline"
                        >
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="asc"
                           >
                              <ArrowUpAZ className="size-3.5" />
                              A-Z
                           </ToggleGroupItem>
                           <ToggleGroupItem
                              className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                              value="desc"
                           >
                              <ArrowDownAZ className="size-3.5" />
                              Z-A
                           </ToggleGroupItem>
                        </ToggleGroup>
                     </div>

                     {hasActiveFilters && (
                        <>
                           <div className="h-4 w-px bg-border" />
                           <Button
                              className="h-8 text-xs"
                              onClick={handleClearFilters}
                              size="sm"
                              variant="outline"
                           >
                              <X className="size-3" />
                              {translate(
                                 "dashboard.routes.tags.features.filter.actions.clear-filters",
                              )}
                           </Button>
                        </>
                     )}
                  </div>
               )}

               {tags.length === 0 && pagination.totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.tags.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.tags.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <DataTable
                     columns={createTagColumns(activeOrganization.slug)}
                     data={tags}
                     enableRowSelection
                     getRowId={(row) => row.id}
                     onRowSelectionChange={setRowSelection}
                     pagination={{
                        currentPage,
                        onPageChange: setCurrentPage,
                        onPageSizeChange: setPageSize,
                        pageSize,
                        totalCount,
                        totalPages,
                     }}
                     renderMobileCard={(props) => (
                        <TagMobileCard {...props} expenses={0} income={0} />
                     )}
                     renderSubComponent={(props) => (
                        <TagExpandedContent
                           {...props}
                           expenses={0}
                           income={0}
                        />
                     )}
                     rowSelection={rowSelection}
                  />
               )}
            </CardContent>
         </Card>

         <SelectionActionBar
            onClear={handleClearSelection}
            selectedCount={selectedIds.length}
         >
            <SelectionActionButton
               disabled={isLoading}
               icon={<Trash2 className="size-3.5" />}
               onClick={() => setIsDeleteDialogOpen(true)}
               variant="destructive"
            >
               {translate("dashboard.routes.tags.bulk-actions.delete")}
            </SelectionActionButton>
         </SelectionActionBar>

         <AlertDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         >
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>
                     {translate(
                        "dashboard.routes.tags.bulk-actions.delete-confirm-title",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                     {translate(
                        "dashboard.routes.tags.bulk-actions.delete-confirm-description",
                        { count: selectedIds.length },
                     )}
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>
                     {translate("common.actions.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                     className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     disabled={isLoading}
                     onClick={() => {
                        deleteSelected(selectedIds);
                     }}
                  >
                     {translate("dashboard.routes.tags.bulk-actions.delete")}
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         <TagFilterSheet
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

export function TagsListSection() {
   return (
      <ErrorBoundary FallbackComponent={TagsListErrorFallback}>
         <Suspense fallback={<TagsListSkeleton />}>
            <TagsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
