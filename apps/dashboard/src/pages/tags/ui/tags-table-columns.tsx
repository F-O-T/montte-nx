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
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Trash2 } from "lucide-react";
import { Suspense } from "react";
import type { Tag } from "@/pages/tags/ui/tags-page";

import { DeleteTag } from "../features/delete-tag";
import { ManageTagSheet } from "../features/manage-tag-sheet";

export function createTagColumns(slug: string): ColumnDef<Tag>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const tag = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div
                     className="size-8 rounded-sm shrink-0"
                     style={{
                        backgroundColor: tag.color,
                     }}
                  />
                  <div className="flex flex-col">
                     <span className="font-medium">{tag.name}</span>
                  </div>
               </div>
            );
         },
         header: translate("dashboard.routes.tags.table.columns.name"),
      },
      {
         cell: ({ row }) => {
            const tag = row.original;

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
                              "dashboard.routes.tags.list-section.actions.label",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem asChild>
                           <Link
                              params={{ slug, tagId: tag.id }}
                              to="/$slug/tags/$tagId"
                           >
                              <Eye className="size-4 mr-2" />
                              {translate(
                                 "dashboard.routes.tags.list-section.actions.view-details",
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
                           <ManageTagSheet asChild tag={tag} />
                           <DeleteTag tag={tag}>
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onSelect={(e) => e.preventDefault()}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 {translate(
                                    "dashboard.routes.tags.list-section.actions.delete",
                                 )}
                              </DropdownMenuItem>
                           </DeleteTag>
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
