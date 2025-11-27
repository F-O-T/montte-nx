import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface BudgetListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   nameFilter: string;
   setNameFilter: (value: string) => void;
   orderBy: "name" | "createdAt" | "updatedAt" | "amount";
   setOrderBy: (value: "name" | "createdAt" | "updatedAt" | "amount") => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
   isFilterSheetOpen: boolean;
   setIsFilterSheetOpen: (open: boolean) => void;
   modeFilter: "personal" | "business" | undefined;
   setModeFilter: (value: "personal" | "business" | undefined) => void;
   activeFilter: boolean | undefined;
   setActiveFilter: (value: boolean | undefined) => void;
}

const BudgetListContext = createContext<BudgetListContextType | undefined>(
   undefined,
);

export function BudgetListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [nameFilter, setNameFilter] = useState("");
   const [orderBy, setOrderBy] = useState<
      "name" | "createdAt" | "updatedAt" | "amount"
   >("name");
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
   const [modeFilter, setModeFilter] = useState<
      "personal" | "business" | undefined
   >(undefined);
   const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
      undefined,
   );

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
      activeFilter,
      clearSelection,
      currentPage,
      handleSelectionChange,
      isFilterSheetOpen,
      modeFilter,
      nameFilter,
      orderBy,
      orderDirection,
      pageSize,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setActiveFilter,
      setCurrentPage,
      setIsFilterSheetOpen,
      setModeFilter,
      setNameFilter,
      setOrderBy,
      setOrderDirection,
      setPageSize,
      toggleAll,
   };

   return (
      <BudgetListContext.Provider value={value}>
         {children}
      </BudgetListContext.Provider>
   );
}

export function useBudgetList() {
   const context = useContext(BudgetListContext);
   if (context === undefined) {
      throw new Error("useBudgetList must be used within a BudgetListProvider");
   }
   return context;
}
