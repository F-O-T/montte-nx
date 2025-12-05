import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface CostCenterListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   nameFilter: string;
   setNameFilter: (value: string) => void;
   orderBy: "name" | "code" | "createdAt" | "updatedAt";
   setOrderBy: (value: "name" | "code" | "createdAt" | "updatedAt") => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
}

const CostCenterListContext = createContext<
   CostCenterListContextType | undefined
>(undefined);

export function CostCenterListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [nameFilter, setNameFilter] = useState("");
   const [orderBy, setOrderBy] = useState<
      "name" | "code" | "createdAt" | "updatedAt"
   >("name");
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(5);

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
      nameFilter,
      orderBy,
      orderDirection,
      pageSize,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setCurrentPage,
      setNameFilter,
      setOrderBy,
      setOrderDirection,
      setPageSize,
      toggleAll,
   };

   return (
      <CostCenterListContext.Provider value={value}>
         {children}
      </CostCenterListContext.Provider>
   );
}

export function useCostCenterList() {
   const context = useContext(CostCenterListContext);
   if (context === undefined) {
      throw new Error(
         "useCostCenterList must be used within a CostCenterListProvider",
      );
   }
   return context;
}
