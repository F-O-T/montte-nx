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
import { MoreVertical, Trash2 } from "lucide-react";
import { Suspense } from "react";
import type { CostCenter } from "@/pages/cost-centers/ui/cost-centers-page";

import { DeleteCostCenter } from "../features/delete-cost-center";
import { ManageCostCenterSheet } from "../features/manage-cost-center-sheet";

export function createCostCenterColumns(): ColumnDef<CostCenter>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const costCenter = row.original;
            return (
               <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                     <span className="font-medium">{costCenter.name}</span>
                     {costCenter.code && (
                        <span className="text-xs text-muted-foreground">
                           {costCenter.code}
                        </span>
                     )}
                  </div>
               </div>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.cost-centers.table.columns.name"),
      },
      {
         accessorKey: "code",
         cell: ({ row }) => {
            const costCenter = row.original;
            return (
               <span className="text-muted-foreground">
                  {costCenter.code || "-"}
               </span>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.cost-centers.table.columns.code"),
      },
      {
         cell: ({ row }) => {
            const costCenter = row.original;

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
                              "dashboard.routes.cost-centers.list-section.actions.label",
                           )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <Suspense
                           fallback={
                              <DropdownMenuItem disabled>
                                 Loading...
                              </DropdownMenuItem>
                           }
                        >
                           <ManageCostCenterSheet
                              asChild
                              costCenter={costCenter}
                           />
                           <DeleteCostCenter costCenter={costCenter}>
                              <DropdownMenuItem
                                 className="text-destructive focus:text-destructive"
                                 onSelect={(e) => e.preventDefault()}
                              >
                                 <Trash2 className="size-4 mr-2" />
                                 {translate(
                                    "dashboard.routes.cost-centers.list-section.actions.delete",
                                 )}
                              </DropdownMenuItem>
                           </DeleteCostCenter>
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
