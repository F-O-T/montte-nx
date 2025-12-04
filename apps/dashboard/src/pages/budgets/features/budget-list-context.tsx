import type React from "react";
import { createContext, useContext, useState } from "react";

export type BudgetPeriodType =
   | "daily"
   | "weekly"
   | "monthly"
   | "quarterly"
   | "yearly";

interface BudgetListContextType {
   periodType: BudgetPeriodType | null;
   setPeriodType: (period: BudgetPeriodType | null) => void;
}

const BudgetListContext = createContext<BudgetListContextType | undefined>(
   undefined,
);

export function BudgetListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   const [periodType, setPeriodType] = useState<BudgetPeriodType | null>(
      "monthly",
   );

   const value = {
      periodType,
      setPeriodType,
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
