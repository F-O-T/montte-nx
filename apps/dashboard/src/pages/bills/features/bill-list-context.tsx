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

interface BillListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   currentFilterType?: "payable" | "receivable";
   setCurrentFilterType: (type?: "payable" | "receivable") => void;

   // Filter state
   categoryFilter: string;
   setCategoryFilter: (value: string) => void;
   statusFilter: string;
   setStatusFilter: (value: string) => void;
   typeFilter: string;
   setTypeFilter: (value: string) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;
   bankAccountFilter: string;
   setBankAccountFilter: (value: string) => void;

   // Pagination
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;

   // Time period and date range
   timePeriod: TimePeriod | null;
   customDateRange: { startDate: Date | null; endDate: Date | null };
   handleTimePeriodChange: (
      period: TimePeriod | null,
      range?: TimePeriodDateRange,
   ) => void;
   setCustomDateRange: (range: {
      startDate: Date | null;
      endDate: Date | null;
   }) => void;
   startDate: Date | null;
   endDate: Date | null;
   selectedMonth: Date;
   handleMonthChange: (month: Date) => void;

   // Filter utilities
   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const BillListContext = createContext<BillListContextType | undefined>(
   undefined,
);

export function BillListProvider({ children }: { children: React.ReactNode }) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [currentFilterType, setCurrentFilterType] = useState<
      "payable" | "receivable" | undefined
   >();

   // Filter state
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [statusFilter, setStatusFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");
   const [bankAccountFilter, setBankAccountFilter] = useState("all");

   // Pagination
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   // Time period state
   const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(
      "this-month",
   );
   const [customDateRange, setCustomDateRange] = useState<{
      startDate: Date | null;
      endDate: Date | null;
   }>({ startDate: null, endDate: null });
   const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

   // Compute effective date range
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

   // Compute if there are active filters
   const hasActiveFilters = useMemo(() => {
      return (
         (timePeriod !== "this-month" && timePeriod !== null) ||
         statusFilter !== "all" ||
         (typeFilter !== "all" && !currentFilterType) ||
         categoryFilter !== "all" ||
         bankAccountFilter !== "all" ||
         searchTerm !== ""
      );
   }, [
      timePeriod,
      statusFilter,
      typeFilter,
      categoryFilter,
      bankAccountFilter,
      searchTerm,
      currentFilterType,
   ]);

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
      (period: TimePeriod | null, range?: TimePeriodDateRange) => {
         setTimePeriod(period);
         if (period === "custom" && range) {
            setCustomDateRange({
               startDate: range.startDate,
               endDate: range.endDate,
            });
            if (range.selectedMonth) {
               setSelectedMonth(range.selectedMonth);
            }
         } else if (period) {
            const dateRange = getDateRangeForPeriod(period);
            if (dateRange.selectedMonth) {
               setSelectedMonth(dateRange.selectedMonth);
            }
         }
      },
      [],
   );

   const handleMonthChange = useCallback((month: Date) => {
      setSelectedMonth(month);
      setTimePeriod(null);
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(
         month.getFullYear(),
         month.getMonth() + 1,
         0,
         23,
         59,
         59,
         999,
      );
      setCustomDateRange({
         startDate: startOfMonth,
         endDate: endOfMonth,
      });
   }, []);

   const clearFilters = useCallback(() => {
      setTimePeriod("this-month");
      setCustomDateRange({ startDate: null, endDate: null });
      setStatusFilter("all");
      setTypeFilter("all");
      setCategoryFilter("all");
      setBankAccountFilter("all");
      setSearchTerm("");
   }, []);

   const value = {
      bankAccountFilter,
      categoryFilter,
      clearFilters,
      clearSelection,
      currentFilterType,
      currentPage,
      customDateRange,
      endDate: effectiveDateRange.endDate,
      handleMonthChange,
      handleSelectionChange,
      handleTimePeriodChange,
      hasActiveFilters,
      pageSize,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      selectedMonth,
      setBankAccountFilter,
      setCategoryFilter,
      setCurrentFilterType,
      setCurrentPage,
      setCustomDateRange,
      setPageSize,
      setSearchTerm,
      setStatusFilter,
      setTypeFilter,
      startDate: effectiveDateRange.startDate,
      statusFilter,
      timePeriod,
      toggleAll,
      typeFilter,
   };

   return (
      <BillListContext.Provider value={value}>
         {children}
      </BillListContext.Provider>
   );
}

export function useBillList() {
   const context = useContext(BillListContext);
   if (context === undefined) {
      throw new Error("useBillList must be used within a BillListProvider");
   }
   return context;
}

export function useBillListOptional() {
   return useContext(BillListContext);
}
