import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface BankAccountTransactionListContextType {
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
   selectedMonth: Date;
   setSelectedMonth: (date: Date) => void;
   searchTerm: string;
   setSearchTerm: (term: string) => void;
}

const BankAccountTransactionListContext = createContext<
   BankAccountTransactionListContextType | undefined
>(undefined);

export function BankAccountTransactionListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
   const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
   const [searchTerm, setSearchTerm] = useState("");

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
      handleSelectionChange,
      searchTerm,
      selectAll,
      selectedCount: selectedItems.size,
      selectedItems,
      selectedMonth,
      setCategoryFilter,
      setSearchTerm,
      setSelectedMonth,
      setTypeFilter,
      toggleAll,
      typeFilter,
   };

   return (
      <BankAccountTransactionListContext.Provider value={value}>
         {children}
      </BankAccountTransactionListContext.Provider>
   );
}

export function useBankAccountTransactionList() {
   const context = useContext(BankAccountTransactionListContext);
   if (context === undefined) {
      throw new Error(
         "useBankAccountTransactionList must be used within a BankAccountTransactionListProvider",
      );
   }
   return context;
}
