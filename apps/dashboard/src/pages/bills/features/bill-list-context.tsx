import {
   getDateRangeForPeriod,
   type TimePeriod,
} from "@packages/ui/components/time-period-chips";
import { endOfMonth, startOfMonth } from "date-fns";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

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
   selectedMonth: Date;
   setSelectedMonth: (date: Date) => void;
   startDate: Date | null;
   setStartDate: (date: Date | null) => void;
   endDate: Date | null;
   setEndDate: (date: Date | null) => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;
   categoryFilter: string;
   setCategoryFilter: (filter: string) => void;
   statusFilter: string;
   setStatusFilter: (filter: string) => void;
   typeFilter: string;
   setTypeFilter: (filter: string) => void;
   // Time period
   timePeriod: TimePeriod | null;
   setTimePeriod: (period: TimePeriod | null) => void;
   handleTimePeriodChange: (period: TimePeriod | null) => void;
   handleMonthChange: (month: Date) => void;
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
   const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(5);
   const [searchTerm, setSearchTerm] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [statusFilter, setStatusFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");

   // Time period state
   const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(
      "this-month",
   );
   const [startDate, setStartDate] = useState<Date | null>(() => {
      const range = getDateRangeForPeriod("this-month");
      return range.startDate;
   });
   const [endDate, setEndDate] = useState<Date | null>(() => {
      const range = getDateRangeForPeriod("this-month");
      return range.endDate;
   });

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

   const handleTimePeriodChange = useCallback((period: TimePeriod | null) => {
      setTimePeriod(period);
      if (period) {
         const range = getDateRangeForPeriod(period);
         setStartDate(range.startDate);
         setEndDate(range.endDate);
         if (range.selectedMonth) {
            setSelectedMonth(range.selectedMonth);
         }
      }
   }, []);

   const handleMonthChange = useCallback((month: Date) => {
      setSelectedMonth(month);
      setTimePeriod(null);
      setStartDate(startOfMonth(month));
      setEndDate(endOfMonth(month));
   }, []);

   const value = {
      categoryFilter,
      clearSelection,
      currentFilterType,
      currentPage,
      endDate,
      handleMonthChange,
      handleSelectionChange,
      handleTimePeriodChange,
      pageSize,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      selectedMonth,
      setCategoryFilter,
      setCurrentFilterType,
      setCurrentPage,
      setEndDate,
      setPageSize,
      setSearchTerm,
      setSelectedMonth,
      setStartDate,
      setStatusFilter,
      setTimePeriod,
      setTypeFilter,
      startDate,
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
