import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface InterestTemplateListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   orderBy: "name" | "createdAt" | "updatedAt";
   setOrderBy: (value: "name" | "createdAt" | "updatedAt") => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;
}

const InterestTemplateListContext = createContext<
   InterestTemplateListContextType | undefined
>(undefined);

export function InterestTemplateListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [orderBy, setOrderBy] = useState<"name" | "createdAt" | "updatedAt">(
      "name",
   );
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
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
      orderBy,
      orderDirection,
      pageSize,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setCurrentPage,
      setOrderBy,
      setOrderDirection,
      setPageSize,
      toggleAll,
   };

   return (
      <InterestTemplateListContext.Provider value={value}>
         {children}
      </InterestTemplateListContext.Provider>
   );
}

export function useInterestTemplateList() {
   const context = useContext(InterestTemplateListContext);
   if (context === undefined) {
      throw new Error(
         "useInterestTemplateList must be used within a InterestTemplateListProvider",
      );
   }
   return context;
}
