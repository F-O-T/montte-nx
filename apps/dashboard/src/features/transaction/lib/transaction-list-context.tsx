import {
   getDateRangeForPeriod,
   type TimePeriod,
} from "@packages/ui/components/time-period-chips";
import { endOfMonth, startOfMonth } from "date-fns";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

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
   selectedMonth: Date;
   setSelectedMonth: (date: Date) => void;

   timePeriod: TimePeriod | null;
   setTimePeriod: (period: TimePeriod | null) => void;
   startDate: Date | null;
   endDate: Date | null;
   setDateRange: (startDate: Date | null, endDate: Date | null) => void;
   handleTimePeriodChange: (period: TimePeriod | null) => void;
   handleMonthChange: (month: Date) => void;
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
   const [typeFilter, setTypeFilter] = useState("all");
   const [searchTerm, setSearchTerm] = useState("");
   const [bankAccountFilter, setBankAccountFilter] = useState("all");
   const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

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

   const setDateRange = useCallback(
      (newStartDate: Date | null, newEndDate: Date | null) => {
         setStartDate(newStartDate);
         setEndDate(newEndDate);
      },
      [],
   );

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
      bankAccountFilter,
      categoryFilter,
      clearSelection,
      endDate,
      handleMonthChange,
      handleSelectionChange,
      handleTimePeriodChange,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      selectedMonth,
      setBankAccountFilter,
      setCategoryFilter,
      setDateRange,
      setSearchTerm,
      setSelectedMonth,
      setTimePeriod,
      setTypeFilter,
      startDate,
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
