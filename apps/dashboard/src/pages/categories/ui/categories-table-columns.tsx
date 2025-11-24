import type { ColumnDef } from "@tanstack/react-table";
import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category } from "@packages/api/src/server/routers/categories";
import { DeleteCategory } from "../features/delete-category";
import { ManageCategorySheet } from "../features/manage-category-sheet";
import { createSlug } from "@packages/utils/text";
import { Link } from "@tanstack/react-router";
import { formatDecimalCurrency } from "@packages/utils/money";

export function createCategoryColumns(): ColumnDef<Category>[] {
	return [
		{
			accessorKey: "name",
			enableSorting: true,
			header: translate("dashboard.routes.categories.table.columns.name"),
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
		},
		{
			accessorKey: "budget",
			enableSorting: true,
			header: translate("dashboard.routes.categories.table.columns.budget"),
			cell: ({ row }) => {
				const budget = row.original.budget;
				if (!budget) return <span className="text-muted-foreground">-</span>;
				return <span>{formatDecimalCurrency(Number(budget))}</span>;
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const category = row.original;

				return (
					<div className="flex justify-end">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button aria-label="Actions" size="icon" variant="ghost">
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
										to={`/categories/${createSlug(category.name)}`}
										className="flex items-center gap-2 w-full"
									>
										<Eye className="size-4 mr-2" />
										{translate(
											"dashboard.routes.categories.list-section.actions.view-details",
										)}
									</Link>
								</DropdownMenuItem>
								<Suspense
									fallback={
										<DropdownMenuItem disabled>Loading...</DropdownMenuItem>
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
		},
	];
}
