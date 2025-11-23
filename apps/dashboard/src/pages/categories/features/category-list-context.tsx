import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface CategoryListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   nameFilter: string;
   setNameFilter: (value: string) => void;
   orderBy: "name" | "createdAt" | "updatedAt";
   setOrderBy: (value: "name" | "createdAt" | "updatedAt") => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;
}

const CategoryListContext = createContext<CategoryListContextType | undefined>(
   undefined,
);

export function CategoryListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [nameFilter, setNameFilter] = useState("");
   const [orderBy, setOrderBy] = useState<"name" | "createdAt" | "updatedAt">(
      "name",
   );
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

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
      handleSelectionChange,
      nameFilter,
      orderBy,
      orderDirection,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      setNameFilter,
      setOrderBy,
      setOrderDirection,
      toggleAll,
   };

   return (
      <CategoryListContext.Provider value={value}>
         {children}
      </CategoryListContext.Provider>
   );
}

export function useCategoryList() {
   const context = useContext(CategoryListContext);
   if (context === undefined) {
      throw new Error(
         "useCategoryList must be used within a CategoryListProvider",
      );
   }
   return context;
}
