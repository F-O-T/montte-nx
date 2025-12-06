import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface CustomReportListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   nameFilter: string;
   setNameFilter: (value: string) => void;
   typeFilter: "dre_gerencial" | "dre_fiscal" | undefined;
   setTypeFilter: (value: "dre_gerencial" | "dre_fiscal" | undefined) => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
}

const CustomReportListContext = createContext<
   CustomReportListContextType | undefined
>(undefined);

export function CustomReportListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [nameFilter, setNameFilter] = useState("");
   const [typeFilter, setTypeFilter] = useState<
      "dre_gerencial" | "dre_fiscal" | undefined
   >(undefined);
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

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
      pageSize,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setCurrentPage,
      setNameFilter,
      setPageSize,
      setTypeFilter,
      toggleAll,
      typeFilter,
   };

   return (
      <CustomReportListContext.Provider value={value}>
         {children}
      </CustomReportListContext.Provider>
   );
}

export function useCustomReportList() {
   const context = useContext(CustomReportListContext);
   if (context === undefined) {
      throw new Error(
         "useCustomReportList must be used within a CustomReportListProvider",
      );
   }
   return context;
}
