import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Eye, MoreVertical, Trash2 } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category } from "@/pages/categories/ui/categories-page";

import { DeleteCategory } from "../features/delete-category";
import { ManageCategorySheet } from "../features/manage-category-sheet";

export function createCategoryColumns(slug: string): ColumnDef<Category>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const category = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div
                     className="size-8 rounded-sm flex items-center justify-center"
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
                  <div className="flex flex-col">
                     <span className="font-medium">{category.name}</span>
                  </div>
               </div>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.categories.table.columns.name"),
      },
      {
         cell: ({ row }) => {
            const category = row.original;

            return (
               <div className="flex justify-end">
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           aria-label="Actions"
                           size="icon"
                           variant="ghost"
                        >
                           <MoreVertical className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                           {translate(
                              "dashboard.routes.categories.list-section.actions.label",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                           <Link
                              params={{ categoryId: category.id, slug }}
                              to="/$slug/categories/$categoryId"
                           >
                              <Eye className="size-4 mr-2" />
                              {translate(
                                 "dashboard.routes.categories.list-section.actions.view-details",
                              )}
                           </Link>
                        </DropdownMenuItem>

                        <Suspense
                           fallback={
                              <DropdownMenuItem disabled>
                                 Loading...
                              </DropdownMenuItem>
                           }
                        >
                           <ManageCategorySheet asChild category={category} />
                           <DeleteCategory category={category}>
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onSelect={(e) => e.preventDefault()}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 {translate(
                                    "dashboard.routes.categories.list-section.actions.delete",
                                 )}
                              </DropdownMenuItem>
                           </DeleteCategory>
                        </Suspense>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            );
         },
         header: "",
         id: "actions",
      },
   ];
}
