import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { cn } from "@packages/ui/lib/utils";
import {
   Calendar,
   CalendarDays,
   CalendarRange,
   Infinity as InfinityIcon,
   RotateCcw,
} from "lucide-react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import {
   type BudgetPeriodType,
   BudgetListProvider,
   useBudgetList,
} from "../features/budget-list-context";
import { ManageBudgetSheet } from "../features/manage-budget-sheet";
import { BudgetsListSection } from "./budgets-list-section";
import { BudgetsStats } from "./budgets-stats";

export type Budget = RouterOutput["budgets"]["getAllPaginated"]["budgets"][0];

function BudgetsPageContent() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { periodType, setPeriodType } = useBudgetList();

   const periodChips = [
      {
         value: "" as const,
         label: translate("dashboard.routes.budgets.filters.all"),
         icon: InfinityIcon,
      },
      {
         value: "daily" as const,
         label: translate("dashboard.routes.budgets.form.period.daily"),
         icon: Calendar,
      },
      {
         value: "weekly" as const,
         label: translate("dashboard.routes.budgets.form.period.weekly"),
         icon: CalendarRange,
      },
      {
         value: "monthly" as const,
         label: translate("dashboard.routes.budgets.form.period.monthly"),
         icon: CalendarDays,
      },
      {
         value: "quarterly" as const,
         label: translate("dashboard.routes.budgets.form.period.quarterly"),
         icon: RotateCcw,
      },
      {
         value: "yearly" as const,
         label: translate("dashboard.routes.budgets.form.period.yearly"),
         icon: CalendarDays,
      },
   ];

   return (
      <main className="space-y-4">
         <DefaultHeader
            actions={
               <Button onClick={() => setIsCreateSheetOpen(true)}>
                  <Plus className="size-4" />
                  {translate(
                     "dashboard.routes.budgets.actions-toolbar.actions.add-new",
                  )}
               </Button>
            }
            description={translate("dashboard.routes.budgets.page.description")}
            title={translate("dashboard.routes.budgets.page.title")}
         />

         <ToggleGroup
            className="flex-wrap justify-start"
            onValueChange={(value) =>
               setPeriodType((value || null) as BudgetPeriodType | null)
            }
            size="sm"
            spacing={2}
            type="single"
            value={periodType || ""}
            variant="outline"
         >
            {periodChips.map((chip) => {
               const Icon = chip.icon;
               return (
                  <ToggleGroupItem
                     aria-label={`Toggle ${chip.value || "all"}`}
                     className={cn(
                        "gap-1.5 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:*:[svg]:stroke-primary",
                        "text-xs px-2 h-7",
                     )}
                     key={chip.value || "all"}
                     value={chip.value}
                  >
                     <Icon className="size-3" />
                     {chip.label}
                  </ToggleGroupItem>
               );
            })}
         </ToggleGroup>

         <BudgetsStats />
         <BudgetsListSection />
         <ManageBudgetSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </main>
   );
}

export function BudgetsPage() {
   return (
      <BudgetListProvider>
         <BudgetsPageContent />
      </BudgetListProvider>
   );
}
