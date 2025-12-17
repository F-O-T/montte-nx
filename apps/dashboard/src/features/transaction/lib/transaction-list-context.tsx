import {
	getDateRangeForPeriod,
	type TimePeriod,
	type TimePeriodDateRange,
} from "@packages/ui/components/time-period-chips";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface TransactionListContextType {
	selectedItems: Set<string>;
	handleSelectionChange: (id: string, selected: boolean) => void;
	clearSelection: () => void;
	selectAll: (ids: string[]) => void;
	toggleAll: (ids: string[]) => void;
	selectedCount: number;

	categoryFilter: string;
	setCategoryFilter: (value: string) => void;
	typeFilter: string;
	setTypeFilter: (value: string) => void;
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	bankAccountFilter: string;
	setBankAccountFilter: (value: string) => void;

	timePeriod: TimePeriod | null;
	customDateRange: { startDate: Date | null; endDate: Date | null };
	handleTimePeriodChange: (
		period: TimePeriod | null,
		range: TimePeriodDateRange,
	) => void;
	setCustomDateRange: (range: {
		startDate: Date | null;
		endDate: Date | null;
	}) => void;

	startDate: Date | null;
	endDate: Date | null;

	clearFilters: () => void;
	hasActiveFilters: boolean;
}

const TransactionListContext = createContext<
	TransactionListContextType | undefined
>(undefined);

export function TransactionListProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [bankAccountFilter, setBankAccountFilter] = useState("all");

	const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(
		"this-month",
	);
	const [customDateRange, setCustomDateRange] = useState<{
		startDate: Date | null;
		endDate: Date | null;
	}>({ startDate: null, endDate: null });

	const effectiveDateRange = useMemo(() => {
		if (timePeriod === "custom") {
			return customDateRange;
		}
		if (timePeriod) {
			const range = getDateRangeForPeriod(timePeriod);
			return { startDate: range.startDate, endDate: range.endDate };
		}
		return { startDate: null, endDate: null };
	}, [timePeriod, customDateRange]);

	const hasActiveFilters = useMemo(() => {
		return (
			(timePeriod !== "this-month" && timePeriod !== null) ||
			typeFilter !== "" ||
			categoryFilter !== "all" ||
			bankAccountFilter !== "all"
		);
	}, [timePeriod, typeFilter, categoryFilter, bankAccountFilter]);

	const handleSelectionChange = useCallback(
		(id: string, selected: boolean) => {
			setSelectedItems((prev) => {
				const newSet = new Set(prev);
				if (selected) {
					newSet.add(id);
				} else {
					newSet.delete(id);
				}
				return newSet;
			});
		},
		[],
	);

	const clearSelection = useCallback(() => {
		setSelectedItems(new Set());
	}, []);

	const selectAll = useCallback((ids: string[]) => {
		setSelectedItems(new Set(ids));
	}, []);

	const toggleAll = useCallback((ids: string[]) => {
		setSelectedItems((prev) => {
			const allSelected = ids.every((id) => prev.has(id));
			return allSelected ? new Set() : new Set(ids);
		});
	}, []);

	const handleTimePeriodChange = useCallback(
		(period: TimePeriod | null, range: TimePeriodDateRange) => {
			setTimePeriod(period);
			if (period === "custom") {
				setCustomDateRange({
					startDate: range.startDate,
					endDate: range.endDate,
				});
			}
		},
		[],
	);

	const clearFilters = useCallback(() => {
		setTimePeriod("this-month");
		setCustomDateRange({ startDate: null, endDate: null });
		setTypeFilter("");
		setCategoryFilter("all");
		setBankAccountFilter("all");
	}, []);

	const value = {
		bankAccountFilter,
		categoryFilter,
		clearFilters,
		clearSelection,
		customDateRange,
		endDate: effectiveDateRange.endDate,
		handleSelectionChange,
		handleTimePeriodChange,
		hasActiveFilters,
		searchTerm,
		selectAll,
		selectedCount: selectedItems.size,
		selectedItems,
		setBankAccountFilter,
		setCategoryFilter,
		setCustomDateRange,
		setSearchTerm,
		setTypeFilter,
		startDate: effectiveDateRange.startDate,
		timePeriod,
		toggleAll,
		typeFilter,
	};

	return (
		<TransactionListContext.Provider value={value}>
			{children}
		</TransactionListContext.Provider>
	);
}

export function useTransactionList() {
	const context = useContext(TransactionListContext);
	if (context === undefined) {
		throw new Error(
			"useTransactionList must be used within a TransactionListProvider",
		);
	}
	return context;
}
