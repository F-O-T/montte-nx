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
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowUpRight,
   Calendar,
   ChevronDown,
   Edit,
   Eye,
   Trash2,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import type { Tag } from "@/pages/tags/ui/tags-page";
import { ManageTagForm } from "../features/manage-tag-form";
import { useDeleteTag } from "../features/use-delete-tag";

function TagActionsCell({ tag }: { tag: Tag }) {
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteTag } = useDeleteTag({ tag });

   return (
      <div className="flex justify-end gap-1">
         <Tooltip>
            <TooltipTrigger asChild>
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{
                        slug: activeOrganization.slug,
                        tagId: tag.id,
                     }}
                     to="/$slug/tags/$tagId"
                  >
                     <Eye className="size-4" />
                  </Link>
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.tags.list-section.actions.view-details",
               )}
            </TooltipContent>
         </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={() =>
                     openSheet({ children: <ManageTagForm tag={tag} /> })
                  }
                  size="icon"
                  variant="outline"
               >
                  <Edit className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.tags.list-section.actions.edit-tag",
               )}
            </TooltipContent>
         </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTag()}
                  size="icon"
                  variant="outline"
               >
                  <Trash2 className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate("dashboard.routes.tags.list-section.actions.delete")}
            </TooltipContent>
         </Tooltip>
      </div>
   );
}

export function createTagColumns(_slug: string): ColumnDef<Tag>[] {
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
         enableSorting: true,
         header: translate("dashboard.routes.tags.table.columns.name"),
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            const tag = row.original;
            return (
               <span className="text-muted-foreground">
                  {formatDate(new Date(tag.createdAt), "DD/MM/YYYY")}
               </span>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.tags.table.columns.created-at"),
      },
      {
         cell: ({ row }) => <TagActionsCell tag={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}

interface TagExpandedContentProps {
   row: Row<Tag>;
   income: number;
   expenses: number;
}

export function TagExpandedContent({
   row,
   income,
   expenses,
}: TagExpandedContentProps) {
   const tag = row.original;
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteTag } = useDeleteTag({ tag });
   const isMobile = useIsMobile();

   const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      openSheet({ children: <ManageTagForm tag={tag} /> });
   };

   const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteTag();
   };

   if (isMobile) {
      return (
         <div className="p-4 space-y-4">
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <ArrowDownLeft className="size-4 text-emerald-500" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.stats-section.total-income.title",
                        )}
                     </p>
                     <p className="text-sm font-medium text-emerald-500">
                        +{formatDecimalCurrency(income)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <ArrowUpRight className="size-4 text-destructive" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
                        )}
                     </p>
                     <p className="text-sm font-medium text-destructive">
                        -{formatDecimalCurrency(expenses)}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">
                        {translate(
                           "dashboard.routes.tags.table.columns.created-at",
                        )}
                     </p>
                     <p className="text-sm font-medium">
                        {formatDate(new Date(tag.createdAt), "DD MMM YYYY")}
                     </p>
                  </div>
               </div>
            </div>

            <Separator />

            <div className="space-y-2">
               <Button
                  asChild
                  className="w-full justify-start"
                  size="sm"
                  variant="outline"
               >
                  <Link
                     params={{
                        slug: activeOrganization.slug,
                        tagId: tag.id,
                     }}
                     to="/$slug/tags/$tagId"
                  >
                     <Eye className="size-4" />
                     {translate(
                        "dashboard.routes.tags.list-section.actions.view-details",
                     )}
                  </Link>
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={handleEdit}
                  size="sm"
                  variant="outline"
               >
                  <Edit className="size-4" />
                  {translate(
                     "dashboard.routes.tags.list-section.actions.edit-tag",
                  )}
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={handleDelete}
                  size="sm"
                  variant="destructive"
               >
                  <Trash2 className="size-4" />
                  {translate(
                     "dashboard.routes.tags.list-section.actions.delete",
                  )}
               </Button>
            </div>
         </div>
      );
   }

   return (
      <div className="p-4 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <ArrowDownLeft className="size-4 text-emerald-500" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bank-accounts.stats-section.total-income.title",
                     )}
                  </p>
                  <p className="text-sm font-medium text-emerald-500">
                     +{formatDecimalCurrency(income)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <ArrowUpRight className="size-4 text-destructive" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
                     )}
                  </p>
                  <p className="text-sm font-medium text-destructive">
                     -{formatDecimalCurrency(expenses)}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <Calendar className="size-4 text-muted-foreground" />
               <div>
                  <p className="text-xs text-muted-foreground">
                     {translate(
                        "dashboard.routes.tags.table.columns.created-at",
                     )}
                  </p>
                  <p className="text-sm font-medium">
                     {formatDate(new Date(tag.createdAt), "DD MMM YYYY")}
                  </p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{
                     slug: activeOrganization.slug,
                     tagId: tag.id,
                  }}
                  to="/$slug/tags/$tagId"
               >
                  <Eye className="size-4" />
                  {translate(
                     "dashboard.routes.tags.list-section.actions.view-details",
                  )}
               </Link>
            </Button>
            <Button onClick={handleEdit} size="sm" variant="outline">
               <Edit className="size-4" />
               {translate(
                  "dashboard.routes.tags.list-section.actions.edit-tag",
               )}
            </Button>
            <Button onClick={handleDelete} size="sm" variant="destructive">
               <Trash2 className="size-4" />
               {translate("dashboard.routes.tags.list-section.actions.delete")}
            </Button>
         </div>
      </div>
   );
}

interface TagMobileCardProps {
   row: Row<Tag>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   income: number;
   expenses: number;
}

export function TagMobileCard({
   row,
   isExpanded,
   toggleExpanded,
}: TagMobileCardProps) {
   const tag = row.original;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <div className="flex items-center gap-3">
               <div
                  className="size-10 rounded-sm"
                  style={{ backgroundColor: tag.color }}
               />
               <div>
                  <CardTitle className="text-base">{tag.name}</CardTitle>
                  <CardDescription>
                     {formatDate(new Date(tag.createdAt), "DD MMM YYYY")}
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent />
         <CardFooter>
            <CollapsibleTrigger asChild>
               <Button
                  className="w-full"
                  onClick={(e) => {
                     e.stopPropagation();
                     toggleExpanded();
                  }}
                  variant="outline"
               >
                  {isExpanded
                     ? translate("common.actions.less-info")
                     : translate("common.actions.more-info")}
                  <ChevronDown
                     className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
               </Button>
            </CollapsibleTrigger>
         </CardFooter>
      </Card>
   );
}
