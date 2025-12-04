import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface CounterpartyListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   orderBy: "name" | "type" | "createdAt" | "updatedAt";
   setOrderBy: (value: "name" | "type" | "createdAt" | "updatedAt") => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
   typeFilter: "client" | "supplier" | "both" | "all";
   setTypeFilter: (value: "client" | "supplier" | "both" | "all") => void;
   isFilterSheetOpen: boolean;
   setIsFilterSheetOpen: (open: boolean) => void;
}

const CounterpartyListContext = createContext<
   CounterpartyListContextType | undefined
>(undefined);

export function CounterpartyListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [orderBy, setOrderBy] = useState<
      "name" | "type" | "createdAt" | "updatedAt"
   >("name");
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);
   const [typeFilter, setTypeFilter] = useState<
      "client" | "supplier" | "both" | "all"
   >("all");
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
      clearSelection,
      currentPage,
      handleSelectionChange,
      isFilterSheetOpen,
      orderBy,
      orderDirection,
      pageSize,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setCurrentPage,
      setIsFilterSheetOpen,
      setOrderBy,
      setOrderDirection,
      setPageSize,
      setTypeFilter,
      toggleAll,
      typeFilter,
   };

   return (
      <CounterpartyListContext.Provider value={value}>
         {children}
      </CounterpartyListContext.Provider>
   );
}

export function useCounterpartyList() {
   const context = useContext(CounterpartyListContext);
   if (context === undefined) {
      throw new Error(
         "useCounterpartyList must be used within a CounterpartyListProvider",
      );
   }
   return context;
}
