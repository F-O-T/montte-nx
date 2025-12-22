import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { DateRangePickerPopover } from "@packages/ui/components/date-range-picker-popover";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@packages/ui/components/popover";
import { Switch } from "@packages/ui/components/switch";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { cn } from "@packages/ui/lib/utils";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	Filter,
	Percent,
	Star,
	TrendingUp,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";
import { InterestTemplateFilterCredenza } from "../features/interest-template-filter-credenza";

type StatusFilter = "active" | "inactive" | "all";
type MonetaryCorrectionFilter = "ipca" | "selic" | "cdi" | "none" | "all";
type InterestTypeFilter = "daily" | "monthly" | "none" | "all";
type PenaltyTypeFilter = "percentage" | "fixed" | "none" | "all";

type InterestTemplateFilterBarProps = {
	// Status filter
	statusFilter: StatusFilter;
	onStatusFilterChange: (value: StatusFilter) => void;

	// Monetary correction filter
	monetaryCorrectionFilter: MonetaryCorrectionFilter;
	onMonetaryCorrectionFilterChange: (value: MonetaryCorrectionFilter) => void;

	// Interest type filter
	interestTypeFilter: InterestTypeFilter;
	onInterestTypeFilterChange: (value: InterestTypeFilter) => void;

	// Penalty type filter
	penaltyTypeFilter: PenaltyTypeFilter;
	onPenaltyTypeFilterChange: (value: PenaltyTypeFilter) => void;

	// Default filter
	isDefaultFilter: boolean | null;
	onIsDefaultFilterChange: (value: boolean | null) => void;

	// Date range
	startDate: Date | null;
	endDate: Date | null;
	onDateRangeChange: (range: {
		startDate: Date | null;
		endDate: Date | null;
	}) => void;

	// Ordering
	orderDirection: "asc" | "desc";
	onOrderDirectionChange: (value: "asc" | "desc") => void;

	// Utilities
	onClearFilters: () => void;
	hasActiveFilters: boolean;
	pageSize: number;
	onPageSizeChange: (size: number) => void;
};

export function InterestTemplateFilterBar({
	statusFilter,
	onStatusFilterChange,
	monetaryCorrectionFilter,
	onMonetaryCorrectionFilterChange,
	interestTypeFilter,
	onInterestTypeFilterChange,
	penaltyTypeFilter,
	onPenaltyTypeFilterChange,
	isDefaultFilter,
	onIsDefaultFilterChange,
	startDate,
	endDate,
	onDateRangeChange,
	orderDirection,
	onOrderDirectionChange,
	onClearFilters,
	hasActiveFilters,
	pageSize,
	onPageSizeChange,
}: InterestTemplateFilterBarProps) {
	const isMobile = useIsMobile();
	const { openCredenza } = useCredenza();
	const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

	const activeFilterCount = [
		statusFilter !== "active",
		monetaryCorrectionFilter !== "all",
		interestTypeFilter !== "all",
		penaltyTypeFilter !== "all",
		isDefaultFilter !== null,
		startDate !== null || endDate !== null,
	].filter(Boolean).length;

	const hasMoreFilters =
		interestTypeFilter !== "all" ||
		penaltyTypeFilter !== "all" ||
		isDefaultFilter !== null ||
		startDate !== null ||
		endDate !== null;

	const openFilterCredenza = () => {
		openCredenza({
			children: (
				<InterestTemplateFilterCredenza
					endDate={endDate}
					hasActiveFilters={hasActiveFilters}
					interestTypeFilter={interestTypeFilter}
					isDefaultFilter={isDefaultFilter}
					monetaryCorrectionFilter={monetaryCorrectionFilter}
					onClearFilters={onClearFilters}
					onDateRangeChange={onDateRangeChange}
					onInterestTypeFilterChange={onInterestTypeFilterChange}
					onIsDefaultFilterChange={onIsDefaultFilterChange}
					onMonetaryCorrectionFilterChange={onMonetaryCorrectionFilterChange}
					onOrderDirectionChange={onOrderDirectionChange}
					onPageSizeChange={onPageSizeChange}
					onPenaltyTypeFilterChange={onPenaltyTypeFilterChange}
					onStatusFilterChange={onStatusFilterChange}
					orderDirection={orderDirection}
					pageSize={pageSize}
					penaltyTypeFilter={penaltyTypeFilter}
					startDate={startDate}
					statusFilter={statusFilter}
				/>
			),
		});
	};

	if (isMobile) {
		return (
			<div className="flex items-center gap-2">
				<Button
					className="gap-2"
					onClick={openFilterCredenza}
					size="sm"
					variant={hasActiveFilters ? "default" : "outline"}
				>
					<Filter className="size-4" />
					{translate(
						"dashboard.routes.interest-templates.features.filter.actions.filters",
					)}
					{activeFilterCount > 0 && (
						<Badge
							className="size-5 p-0 justify-center"
							variant="secondary"
						>
							{activeFilterCount}
						</Badge>
					)}
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			{/* Status filter */}
			<ToggleGroup
				onValueChange={(value) => {
					if (value) {
						onStatusFilterChange(value as StatusFilter);
					}
				}}
				size="sm"
				spacing={2}
				type="single"
				value={statusFilter}
				variant="outline"
			>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
					value="all"
				>
					{translate(
						"dashboard.routes.interest-templates.features.filter.status.all",
					)}
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
					value="active"
				>
					<CheckCircle2 className="size-3.5" />
					{translate(
						"dashboard.routes.interest-templates.features.filter.status.active",
					)}
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
					value="inactive"
				>
					<XCircle className="size-3.5" />
					{translate(
						"dashboard.routes.interest-templates.features.filter.status.inactive",
					)}
				</ToggleGroupItem>
			</ToggleGroup>

			<div className="h-4 w-px bg-border" />

			{/* Monetary Correction filter */}
			<ToggleGroup
				onValueChange={(value) => {
					if (value) {
						onMonetaryCorrectionFilterChange(
							value as MonetaryCorrectionFilter,
						);
					}
				}}
				size="sm"
				spacing={2}
				type="single"
				value={monetaryCorrectionFilter}
				variant="outline"
			>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
					value="all"
				>
					{translate(
						"dashboard.routes.interest-templates.features.filter.monetary-correction.all",
					)}
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-blue-500 data-[state=on]:text-blue-600"
					value="ipca"
				>
					<TrendingUp className="size-3.5" />
					IPCA
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-purple-500 data-[state=on]:text-purple-600"
					value="selic"
				>
					SELIC
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-amber-500 data-[state=on]:text-amber-600"
					value="cdi"
				>
					CDI
				</ToggleGroupItem>
				<ToggleGroupItem
					className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-muted-foreground data-[state=on]:text-muted-foreground"
					value="none"
				>
					{translate(
						"dashboard.routes.interest-templates.features.filter.monetary-correction.none",
					)}
				</ToggleGroupItem>
			</ToggleGroup>

			<div className="h-4 w-px bg-border" />

			{/* More filters popover */}
			<Popover onOpenChange={setMoreFiltersOpen} open={moreFiltersOpen}>
				<PopoverTrigger asChild>
					<Button
						className={cn(
							"gap-1.5 pr-2",
							hasMoreFilters && "border-primary text-primary",
						)}
						size="sm"
						variant="outline"
					>
						<Filter className="size-3.5" />
						{translate(
							"dashboard.routes.interest-templates.features.filter.actions.more-filters",
						)}
						<ChevronDown
							className={cn(
								"size-3.5 transition-transform",
								moreFiltersOpen && "rotate-180",
							)}
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" className="w-80 p-0">
					<div className="border-b px-4 py-3">
						<h4 className="font-medium text-sm">
							{translate(
								"dashboard.routes.interest-templates.features.filter.actions.advanced-filters",
							)}
						</h4>
						<p className="text-xs text-muted-foreground mt-0.5">
							{translate(
								"dashboard.routes.interest-templates.features.filter.actions.advanced-filters-description",
							)}
						</p>
					</div>

					<div className="p-4 space-y-4">
						{/* Interest Type filter */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<Percent className="size-4 text-muted-foreground" />
								<label className="text-sm font-medium">
									{translate(
										"dashboard.routes.interest-templates.features.filter.interest-type.label",
									)}
								</label>
							</div>
							<ToggleGroup
								className="justify-start"
								onValueChange={(value) => {
									if (value) {
										onInterestTypeFilterChange(value as InterestTypeFilter);
									}
								}}
								size="sm"
								spacing={2}
								type="single"
								value={interestTypeFilter}
								variant="outline"
							>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="all"
								>
									{translate(
										"dashboard.routes.interest-templates.features.filter.interest-type.all",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="daily"
								>
									{translate(
										"dashboard.routes.interest-templates.form.interest-type.daily",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="monthly"
								>
									{translate(
										"dashboard.routes.interest-templates.form.interest-type.monthly",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="none"
								>
									{translate(
										"dashboard.routes.interest-templates.form.interest-type.none",
									)}
								</ToggleGroupItem>
							</ToggleGroup>
						</div>

						{/* Penalty Type filter */}
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<AlertTriangle className="size-4 text-muted-foreground" />
								<label className="text-sm font-medium">
									{translate(
										"dashboard.routes.interest-templates.features.filter.penalty-type.label",
									)}
								</label>
							</div>
							<ToggleGroup
								className="justify-start"
								onValueChange={(value) => {
									if (value) {
										onPenaltyTypeFilterChange(value as PenaltyTypeFilter);
									}
								}}
								size="sm"
								spacing={2}
								type="single"
								value={penaltyTypeFilter}
								variant="outline"
							>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="all"
								>
									{translate(
										"dashboard.routes.interest-templates.features.filter.penalty-type.all",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="percentage"
								>
									{translate(
										"dashboard.routes.interest-templates.form.penalty-type.percentage",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="fixed"
								>
									{translate(
										"dashboard.routes.interest-templates.form.penalty-type.fixed",
									)}
								</ToggleGroupItem>
								<ToggleGroupItem
									className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
									value="none"
								>
									{translate(
										"dashboard.routes.interest-templates.form.penalty-type.none",
									)}
								</ToggleGroupItem>
							</ToggleGroup>
						</div>

						{/* Default Template toggle */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Star className="size-4 text-muted-foreground" />
								<label className="text-sm font-medium">
									{translate(
										"dashboard.routes.interest-templates.features.filter.is-default.label",
									)}
								</label>
							</div>
							<Switch
								checked={isDefaultFilter === true}
								onCheckedChange={(checked) =>
									onIsDefaultFilterChange(checked ? true : null)
								}
							/>
						</div>

						{/* Date Range */}
						<div className="space-y-2">
							<label className="text-sm font-medium">
								{translate(
									"dashboard.routes.interest-templates.features.filter.date-range.label",
								)}
							</label>
							<DateRangePickerPopover
								endDate={endDate}
								onRangeChange={onDateRangeChange}
								placeholder={translate(
									"dashboard.routes.interest-templates.features.filter.date-range.placeholder",
								)}
								startDate={startDate}
							/>
						</div>
					</div>

					{hasMoreFilters && (
						<div className="border-t px-4 py-3">
							<Button
								className="w-full"
								onClick={() => {
									onInterestTypeFilterChange("all");
									onPenaltyTypeFilterChange("all");
									onIsDefaultFilterChange(null);
									onDateRangeChange({
										startDate: null,
										endDate: null,
									});
								}}
								size="sm"
								variant="ghost"
							>
								<X className="size-3.5 mr-2" />
								{translate(
									"dashboard.routes.interest-templates.features.filter.actions.clear-advanced-filters",
								)}
							</Button>
						</div>
					)}
				</PopoverContent>
			</Popover>

			{/* Active filter badges */}
			{interestTypeFilter !== "all" && (
				<Badge
					className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
					onClick={() => onInterestTypeFilterChange("all")}
					variant="secondary"
				>
					<Percent className="size-3" />
					<span className="max-w-24 truncate">
						{translate(
							`dashboard.routes.interest-templates.form.interest-type.${interestTypeFilter}`,
						)}
					</span>
					<X className="size-3" />
				</Badge>
			)}

			{penaltyTypeFilter !== "all" && (
				<Badge
					className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
					onClick={() => onPenaltyTypeFilterChange("all")}
					variant="secondary"
				>
					<AlertTriangle className="size-3" />
					<span className="max-w-24 truncate">
						{translate(
							`dashboard.routes.interest-templates.form.penalty-type.${penaltyTypeFilter}`,
						)}
					</span>
					<X className="size-3" />
				</Badge>
			)}

			{isDefaultFilter === true && (
				<Badge
					className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
					onClick={() => onIsDefaultFilterChange(null)}
					variant="secondary"
				>
					<Star className="size-3" />
					<span className="max-w-24 truncate">
						{translate(
							"dashboard.routes.interest-templates.features.filter.is-default.label",
						)}
					</span>
					<X className="size-3" />
				</Badge>
			)}

			{(startDate || endDate) && (
				<Badge
					className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
					onClick={() =>
						onDateRangeChange({ startDate: null, endDate: null })
					}
					variant="secondary"
				>
					<span className="max-w-32 truncate">
						{startDate && endDate
							? `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`
							: startDate
								? `A partir de ${startDate.toLocaleDateString("pt-BR")}`
								: `Até ${endDate?.toLocaleDateString("pt-BR")}`}
					</span>
					<X className="size-3" />
				</Badge>
			)}

			{hasActiveFilters && (
				<Button
					className="h-8 text-xs"
					onClick={onClearFilters}
					size="sm"
					variant="outline"
				>
					<X className="size-3" />
					{translate(
						"dashboard.routes.interest-templates.features.filter.actions.clear-filters",
					)}
				</Button>
			)}
		</div>
	);
}
