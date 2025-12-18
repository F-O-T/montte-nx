import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { CategoryListProvider, useCategoryList } from "../features/category-list-context";
import { ManageCategoryForm } from "../features/manage-category-form";
import { CategoryFilterBar } from "./category-filter-bar";
import { CategoriesListSection } from "./categories-list-section";
import { CategoriesStats } from "./categories-stats";

export type Category =
	RouterOutput["categories"]["getAllPaginated"]["categories"][0];

function CategoryFilterBarSkeleton() {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton className="h-8 w-20" key={`period-skeleton-${i + 1}`} />
					))}
				</div>
				<Skeleton className="h-8 w-32" />
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex gap-1">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-24" />
				</div>
				<div className="h-8 w-px bg-border" />
				<Skeleton className="h-8 w-32" />
			</div>
		</div>
	);
}

function CategoryFilterBarWrapper() {
	const {
		timePeriod,
		handleTimePeriodChange,
		customDateRange,
		setCustomDateRange,
		typeFilter,
		setTypeFilter,
		orderBy,
		setOrderBy,
		orderDirection,
		setOrderDirection,
		pageSize,
		setPageSize,
		clearFilters,
		hasActiveFilters,
	} = useCategoryList();

	return (
		<CategoryFilterBar
			customDateRange={customDateRange}
			hasActiveFilters={hasActiveFilters}
			onClearFilters={clearFilters}
			onCustomDateRangeChange={setCustomDateRange}
			onOrderByChange={setOrderBy}
			onOrderDirectionChange={setOrderDirection}
			onPageSizeChange={setPageSize}
			onTimePeriodChange={handleTimePeriodChange}
			onTypeFilterChange={setTypeFilter}
			orderBy={orderBy}
			orderDirection={orderDirection}
			pageSize={pageSize}
			timePeriod={timePeriod}
			typeFilter={typeFilter}
		/>
	);
}

function CategoriesPageContent() {
	const { openSheet } = useSheet();

	return (
		<main className="space-y-4">
			<DefaultHeader
				actions={
					<Button
						onClick={() =>
							openSheet({ children: <ManageCategoryForm /> })
						}
					>
						<Plus className="size-4" />
						{translate(
							"dashboard.routes.categories.actions-toolbar.actions.add-new",
						)}
					</Button>
				}
				description={translate(
					"dashboard.routes.categories.list-section.description",
				)}
				title={translate(
					"dashboard.routes.categories.list-section.title",
				)}
			/>

			<Suspense fallback={<CategoryFilterBarSkeleton />}>
				<CategoryFilterBarWrapper />
			</Suspense>

			<CategoriesStats />
			<CategoriesListSection />
		</main>
	);
}

export function CategoriesPage() {
	return (
		<CategoryListProvider>
			<CategoriesPageContent />
		</CategoryListProvider>
	);
}
