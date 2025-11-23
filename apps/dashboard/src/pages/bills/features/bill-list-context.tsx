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
   startDate?: Date;
   setStartDate: (date?: Date) => void;
   endDate?: Date;
   setEndDate: (date?: Date) => void;
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
   isFilterSheetOpen: boolean;
   setIsFilterSheetOpen: (open: boolean) => void;
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
   const [startDate, setStartDate] = useState<Date | undefined>();
   const [endDate, setEndDate] = useState<Date | undefined>();
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(5);
   const [searchTerm, setSearchTerm] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [statusFilter, setStatusFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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

   const value = {
      categoryFilter,
      clearSelection,
      currentFilterType,
      currentPage,
      handleSelectionChange,
      isFilterSheetOpen,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      // Filter state
      selectedMonth,
      startDate,
      endDate,
      pageSize,
      setCategoryFilter,
      setCurrentFilterType,
      setCurrentPage,
      setEndDate,
      setIsFilterSheetOpen,
      setPageSize,
      setSearchTerm,
      setSelectedMonth,
      setStartDate,
      setStatusFilter,
      setTypeFilter,
      statusFilter,
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
