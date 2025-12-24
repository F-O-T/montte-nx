import { translate } from "@packages/localization";
import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/money";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowLeftRight,
   ArrowUpRight,
   Calendar,
   ChevronDown,
   Edit,
   Eye,
   Trash2,
} from "lucide-react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import type { Category } from "@/pages/categories/ui/categories-page";
import { ManageCategoryForm } from "../features/manage-category-form";
import { useDeleteCategory } from "../features/use-delete-category";

function CategoryActionsCell({ category }: { category: Category }) {
   const { activeOrganization } = useActiveOrganization();

   return (
      <div className="flex justify-end">
         <Tooltip>
            <TooltipTrigger asChild>
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{
                        categoryId: category.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/categories/$categoryId"
                  >
                     <Eye className="size-4" />
                  </Link>
               </Button>
            </TooltipTrigger>
            <TooltipContent>
               {translate(
                  "dashboard.routes.categories.list-section.actions.view-details",
               )}
            </TooltipContent>
         </Tooltip>
      </div>
   );
}

const TRANSACTION_TYPE_CONFIG = {
   expense: {
      color: "#ef4444",
      icon: ArrowUpRight,
      label: translate(
         "dashboard.routes.transactions.list-section.types.expense",
      ),
   },
   income: {
      color: "#10b981",
      icon: ArrowDownLeft,
      label: translate(
         "dashboard.routes.transactions.list-section.types.income",
      ),
   },
   transfer: {
      color: "#3b82f6",
      icon: ArrowLeftRight,
      label: translate(
         "dashboard.routes.transactions.list-section.types.transfer",
      ),
   },
};

export function createCategoryColumns(_slug: string): ColumnDef<Category>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const category = row.original;
            return (
               <Announcement>
                  <AnnouncementTag
                     style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                     }}
                  >
                     <IconDisplay
                        iconName={(category.icon || "Wallet") as IconName}
                        size={14}
                     />
                  </AnnouncementTag>
                  <AnnouncementTitle className="max-w-[150px] truncate">
                     {category.name}
                  </AnnouncementTitle>
               </Announcement>
            );
         },
         enableSorting: true,
         header: translate("dashboard.routes.categories.table.columns.name"),
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            const category = row.original;
            return (
               <Announcement>
                  <AnnouncementTag>
                     <Calendar className="size-3.5" />
                  </AnnouncementTag>
                  <AnnouncementTitle className="text-muted-foreground">
                     {formatDate(new Date(category.createdAt), "DD MMM YYYY")}
                  </AnnouncementTitle>
               </Announcement>
            );
         },
         enableSorting: true,
         header: translate(
            "dashboard.routes.categories.table.columns.created-at",
         ),
      },
      {
         cell: ({ row }) => <CategoryActionsCell category={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}

interface CategoryExpandedContentProps {
   row: Row<Category>;
   income: number;
   expenses: number;
}

export function CategoryExpandedContent({
   row,
   income,
   expenses,
}: CategoryExpandedContentProps) {
   const category = row.original;
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteCategory } = useDeleteCategory({ category });
   const types = category.transactionTypes || ["income", "expense", "transfer"];

   const statsRow = (
      <div className="flex flex-wrap items-center gap-2">
         <Announcement>
            <AnnouncementTag className="flex items-center gap-1.5">
               <ArrowDownLeft className="size-3.5 text-emerald-500" />
               {translate(
                  "dashboard.routes.bank-accounts.stats-section.total-income.title",
               )}
            </AnnouncementTag>
            <AnnouncementTitle className="text-emerald-500">
               +{formatDecimalCurrency(income)}
            </AnnouncementTitle>
         </Announcement>

         <div className="h-4 w-px bg-border" />

         <Announcement>
            <AnnouncementTag className="flex items-center gap-1.5">
               <ArrowUpRight className="size-3.5 text-destructive" />
               {translate(
                  "dashboard.routes.bank-accounts.stats-section.total-expenses.title",
               )}
            </AnnouncementTag>
            <AnnouncementTitle className="text-destructive">
               -{formatDecimalCurrency(expenses)}
            </AnnouncementTitle>
         </Announcement>

         <div className="h-4 w-px bg-border" />

         <div className="flex items-center gap-1">
            {types.map((type) => {
               const config =
                  TRANSACTION_TYPE_CONFIG[
                     type as keyof typeof TRANSACTION_TYPE_CONFIG
                  ];
               if (!config) return null;
               const Icon = config.icon;
               return (
                  <Announcement key={type}>
                     <AnnouncementTag
                        className="flex items-center gap-1"
                        style={{
                           backgroundColor: `${config.color}20`,
                           color: config.color,
                        }}
                     >
                        <Icon className="size-3" />
                     </AnnouncementTag>
                     <AnnouncementTitle style={{ color: config.color }}>
                        {config.label}
                     </AnnouncementTitle>
                  </Announcement>
               );
            })}
         </div>
      </div>
   );

   const actionsRow = (
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
         <Button asChild size="sm" variant="outline">
            <Link
               params={{
                  categoryId: category.id,
                  slug: activeOrganization.slug,
               }}
               to="/$slug/categories/$categoryId"
            >
               <Eye className="size-4" />
               {translate(
                  "dashboard.routes.categories.list-section.actions.view-details",
               )}
            </Link>
         </Button>
         <Button
            onClick={(e) => {
               e.stopPropagation();
               openSheet({
                  children: <ManageCategoryForm category={category} />,
               });
            }}
            size="sm"
            variant="outline"
         >
            <Edit className="size-4" />
            {translate(
               "dashboard.routes.categories.list-section.actions.edit-category",
            )}
         </Button>
         <Button
            onClick={(e) => {
               e.stopPropagation();
               deleteCategory();
            }}
            size="sm"
            variant="destructive"
         >
            <Trash2 className="size-4" />
            {translate(
               "dashboard.routes.categories.list-section.actions.delete-category",
            )}
         </Button>
      </div>
   );

   return (
      <div className="p-4 space-y-4">
         {statsRow}
         {actionsRow}
      </div>
   );
}

interface CategoryMobileCardProps {
   row: Row<Category>;
   isExpanded: boolean;
   toggleExpanded: () => void;
   income: number;
   expenses: number;
}

export function CategoryMobileCard({
   row,
   isExpanded,
   toggleExpanded,
   income,
   expenses,
}: CategoryMobileCardProps) {
   const category = row.original;
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteCategory } = useDeleteCategory({ category });
   const types = category.transactionTypes || ["income", "expense", "transfer"];

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <div className="flex items-center gap-3">
               <div
                  className="size-10 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: category.color }}
               >
                  <IconDisplay
                     className="text-white"
                     iconName={(category.icon || "Wallet") as IconName}
                     size={20}
                  />
               </div>
               <div>
                  <CardTitle className="text-base">{category.name}</CardTitle>
                  <CardDescription>
                     {formatDate(new Date(category.createdAt), "DD MMM YYYY")}
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
               {types.map((type) => {
                  const config =
                     TRANSACTION_TYPE_CONFIG[
                        type as keyof typeof TRANSACTION_TYPE_CONFIG
                     ];
                  if (!config) return null;
                  const Icon = config.icon;
                  return (
                     <Announcement key={type}>
                        <AnnouncementTag
                           className="flex items-center gap-1"
                           style={{
                              backgroundColor: `${config.color}20`,
                              color: config.color,
                           }}
                        >
                           <Icon className="size-3" />
                        </AnnouncementTag>
                        <AnnouncementTitle style={{ color: config.color }}>
                           {config.label}
                        </AnnouncementTitle>
                     </Announcement>
                  );
               })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
               <Announcement>
                  <AnnouncementTag className="flex items-center gap-1.5">
                     <ArrowDownLeft className="size-3.5 text-emerald-500" />
                  </AnnouncementTag>
                  <AnnouncementTitle className="text-emerald-500">
                     +{formatDecimalCurrency(income)}
                  </AnnouncementTitle>
               </Announcement>
               <Announcement>
                  <AnnouncementTag className="flex items-center gap-1.5">
                     <ArrowUpRight className="size-3.5 text-destructive" />
                  </AnnouncementTag>
                  <AnnouncementTitle className="text-destructive">
                     -{formatDecimalCurrency(expenses)}
                  </AnnouncementTitle>
               </Announcement>
            </div>
         </CardContent>
         <CardFooter className="flex-col gap-2">
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
            {isExpanded && (
               <div className="w-full space-y-2 pt-2 border-t">
                  <Button
                     asChild
                     className="w-full justify-start"
                     size="sm"
                     variant="outline"
                  >
                     <Link
                        params={{
                           categoryId: category.id,
                           slug: activeOrganization.slug,
                        }}
                        to="/$slug/categories/$categoryId"
                     >
                        <Eye className="size-4" />
                        {translate(
                           "dashboard.routes.categories.list-section.actions.view-details",
                        )}
                     </Link>
                  </Button>
                  <Button
                     className="w-full justify-start"
                     onClick={(e) => {
                        e.stopPropagation();
                        openSheet({
                           children: <ManageCategoryForm category={category} />,
                        });
                     }}
                     size="sm"
                     variant="outline"
                  >
                     <Edit className="size-4" />
                     {translate(
                        "dashboard.routes.categories.list-section.actions.edit-category",
                     )}
                  </Button>
                  <Button
                     className="w-full justify-start"
                     onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory();
                     }}
                     size="sm"
                     variant="destructive"
                  >
                     <Trash2 className="size-4" />
                     {translate(
                        "dashboard.routes.categories.list-section.actions.delete-category",
                     )}
                  </Button>
               </div>
            )}
         </CardFooter>
      </Card>
   );
}
