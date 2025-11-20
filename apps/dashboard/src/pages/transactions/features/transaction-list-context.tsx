import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface TransactionListContextType {
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;
   bankAccountFilter: string;
   setBankAccountFilter: (value: string) => void;
   categoryFilter: string;
   setCategoryFilter: (value: string) => void;
   typeFilter: string;
   setTypeFilter: (value: string) => void;
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
   const [bankAccountFilter, setBankAccountFilter] = useState("all");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");

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
      bankAccountFilter,
      setBankAccountFilter,
      categoryFilter,
      setCategoryFilter,
      typeFilter,
      setTypeFilter,
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
