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
import { Checkbox } from "@packages/ui/components/checkbox";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
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
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
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
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { useMediaQuery } from "@packages/ui/hooks/use-media-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FilePlus, Inbox, MoreVertical } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { trpc } from "@/integrations/clients";
import { AddCategorySheet } from "../features/add-category-sheet";
import { DeleteCategory } from "../features/delete-category";
import { EditCategorySheet } from "../features/edit-category-sheet";

function CategoriesTableErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
               Manage your transaction categories
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Failed to load categories. Please try again later.",
               errorTitle: "Error loading categories",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function CategoriesTableSkeleton() {
   return (
      <Card>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>
                     <Skeleton className="h-6 w-32" />
                  </CardTitle>
                  <CardDescription>
                     <Skeleton className="h-4 w-64 mt-2" />
                  </CardDescription>
               </div>
               <Skeleton className="h-10 w-20" />
            </div>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
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
      </Card>
   );
}

function CategoriesTableContent() {
   const [open, setOpen] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const limit = 10;

   const { data: paginatedData } = useSuspenseQuery(
      trpc.categories.getAllPaginated.queryOptions({
         limit,
         page: currentPage,
      }),
   );

   const { categories, pagination } = paginatedData;
   const isMobile = useMediaQuery("(max-width: 640px)");

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Categories</CardTitle>
               <CardDescription>
                  Manage your transaction categories
               </CardDescription>
               <CardAction>
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label="Categories actions"
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="w-5 h-5" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>
                           Categories Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem
                              className="flex gap-2"
                              onSelect={() => setOpen(true)}
                           >
                              <FilePlus className="size-4" />
                              Add Category
                           </DropdownMenuItem>
                        </DropdownMenuGroup>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </CardAction>
            </CardHeader>
            <CardContent>
               {categories.length === 0 && pagination.totalCount === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Inbox className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>No categories yet</EmptyTitle>
                        <EmptyDescription>
                           Create your first category to get started organizing
                           your transactions.
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <div className="space-y-4">
                     {isMobile ? (
                        /* Mobile Item Layout */
                        <ItemGroup className="grid grid-cols-1 gap-4">
                           {categories.map((category) => (
                              <Item key={category.id} variant="outline">
                                 <ItemMedia variant="icon">
                                    <div
                                       className="size-8 rounded-sm border flex items-center justify-center"
                                       style={{
                                          backgroundColor: category.color,
                                       }}
                                    >
                                       <IconDisplay
                                          className="text-white"
                                          iconName={(category.icon || "Wallet") as IconName}
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
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button
                                             className="h-8 w-8 p-0"
                                             size="icon"
                                             variant="ghost"
                                          >
                                             <span className="sr-only">
                                                Open menu
                                             </span>
                                             <MoreVertical className="h-4 w-4" />
                                          </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end">
                                          <EditCategorySheet
                                             asChild
                                             category={category}
                                          />
                                          <DeleteCategory
                                             asChild
                                             category={category}
                                          />
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </ItemActions>
                              </Item>
                           ))}
                        </ItemGroup>
                     ) : (
                        /* Desktop Table Layout */
                        <div className="rounded-md border">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead className="w-12">
                                       <Checkbox />
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Actions</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {categories.map((category) => (
                                    <TableRow key={category.id}>
                                       <TableCell>
                                          <Checkbox />
                                       </TableCell>
                                       <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                             <div
                                                className="w-8 h-8 rounded-sm border flex items-center justify-center"
                                                style={{
                                                   backgroundColor: category.color,
                                                }}
                                             >
                                                <IconDisplay
                                                   className="text-white"
                                                   iconName={(category.icon || "Wallet") as IconName}
                                                   size={16}
                                                />
                                             </div>
                                             {category.name}
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <div className="flex items-center gap-2">
                                             <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{
                                                   backgroundColor:
                                                      category.color,
                                                }}
                                             />
                                             <span className="text-sm text-muted-foreground">
                                                {category.color}
                                             </span>
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                                <Button
                                                   className="h-8 w-8 p-0"
                                                   variant="ghost"
                                                >
                                                   <span className="sr-only">
                                                      Open menu
                                                   </span>
                                                   <MoreVertical className="h-4 w-4" />
                                                </Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent align="end">
                                                <EditCategorySheet
                                                   asChild
                                                   category={category}
                                                />
                                                <DeleteCategory
                                                   asChild
                                                   category={category}
                                                />
                                             </DropdownMenuContent>
                                          </DropdownMenu>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </div>
                     )}
                  </div>
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
                                 href="#"
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
                              href="#"
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
         <AddCategorySheet onOpen={open} onOpenChange={setOpen} />
      </>
   );
}

export function CategoriesTable() {
   return (
      <ErrorBoundary FallbackComponent={CategoriesTableErrorFallback}>
         <Suspense fallback={<CategoriesTableSkeleton />}>
            <CategoriesTableContent />
         </Suspense>
      </ErrorBoundary>
   );
}
