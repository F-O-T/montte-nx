import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface BillListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
}

const BillListContext = createContext<BillListContextType | undefined>(undefined);

export function BillListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      toggleAll,
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
      throw new Error(
         "useBillList must be used within a BillListProvider",
      );
   }
   return context;
}