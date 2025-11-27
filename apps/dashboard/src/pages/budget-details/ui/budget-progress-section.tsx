import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { BudgetProgressBar } from "@/pages/budgets/ui/budget-progress-bar";

type Budget = RouterOutput["budgets"]["getById"];

interface BudgetProgressSectionProps {
   budget: Budget;
}

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(value);
}

export function BudgetProgressSection({ budget }: BudgetProgressSectionProps) {
   const totalAmount = parseFloat(budget.amount);
   const { progress, currentPeriod } = budget;

   const spent = progress.spent;
   const scheduled = progress.scheduled;
   const rollover = currentPeriod
      ? parseFloat(currentPeriod.rolloverAmount || "0")
      : 0;
   const available = progress.available;
   const percentage = progress.percentage;
   const forecastPercentage = progress.forecastPercentage;

   const isOverBudget = percentage >= 100;
   const isNearLimit = percentage >= 80 && percentage < 100;

   return (
      <Card>
         <CardHeader>
            <CardTitle>Progresso do Período</CardTitle>
            <CardDescription>
               Acompanhe quanto foi gasto em relação ao limite definido
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <BudgetProgressBar
               available={available}
               className="py-2"
               forecastPercentage={forecastPercentage}
               percentage={percentage}
               scheduled={scheduled}
               showLabels={false}
               spent={spent}
               total={totalAmount}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                     {translate("dashboard.routes.budgets.progress.spent")}
                  </p>
                  <p
                     className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : isNearLimit ? "text-yellow-600" : ""}`}
                  >
                     {formatCurrency(spent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {percentage.toFixed(1)}% do orçamento
                  </p>
               </div>

               {scheduled > 0 && (
                  <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">
                        {translate(
                           "dashboard.routes.budgets.progress.scheduled",
                        )}
                     </p>
                     <p className="text-2xl font-bold text-primary/60">
                        {formatCurrency(scheduled)}
                     </p>
                     <p className="text-xs text-muted-foreground">
                        {((scheduled / totalAmount) * 100).toFixed(1)}% do
                        orçamento
                     </p>
                  </div>
               )}

               <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                     {translate("dashboard.routes.budgets.progress.available")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                     {formatCurrency(available)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     {((available / totalAmount) * 100).toFixed(1)}% restante
                  </p>
               </div>

               <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                     {translate("dashboard.routes.budgets.form.amount.label")}
                  </p>
                  <p className="text-2xl font-bold">
                     {formatCurrency(totalAmount)}
                  </p>
                  {rollover > 0 && (
                     <p className="text-xs text-muted-foreground">
                        + {formatCurrency(rollover)}{" "}
                        {translate(
                           "dashboard.routes.budgets.progress.rollover",
                        )}
                     </p>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
