import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteBudget } from "@/pages/budgets/features/delete-budget";
import { ManageBudgetSheet } from "@/pages/budgets/features/manage-budget-sheet";

type Budget = RouterOutput["budgets"]["getById"];
type BudgetTarget =
   | { type: "category"; categoryId: string }
   | { type: "categories"; categoryIds: string[] }
   | { type: "tag"; tagId: string }
   | { type: "cost_center"; costCenterId: string };

interface BudgetInformationSectionProps {
   budget: Budget;
}

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(value);
}

export function BudgetInformationSection({
   budget,
}: BudgetInformationSectionProps) {
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

   const periodLabels: Record<string, string> = {
      daily: translate("dashboard.routes.budgets.form.period.daily"),
      weekly: translate("dashboard.routes.budgets.form.period.weekly"),
      monthly: translate("dashboard.routes.budgets.form.period.monthly"),
      quarterly: translate("dashboard.routes.budgets.form.period.quarterly"),
      yearly: translate("dashboard.routes.budgets.form.period.yearly"),
      custom: translate("dashboard.routes.budgets.form.period.custom"),
   };

   const modeLabels: Record<string, string> = {
      personal: translate("dashboard.routes.budgets.form.mode.personal"),
      business: translate("dashboard.routes.budgets.form.mode.business"),
   };

   const regimeLabels: Record<string, string> = {
      cash: translate("dashboard.routes.budgets.form.regime.cash"),
      accrual: translate("dashboard.routes.budgets.form.regime.accrual"),
   };

   const targetTypeLabels: Record<string, string> = {
      category: translate("dashboard.routes.budgets.form.target.category"),
      categories: translate("dashboard.routes.budgets.form.target.categories"),
      tag: translate("dashboard.routes.budgets.form.target.tag"),
      cost_center: translate(
         "dashboard.routes.budgets.form.target.cost_center",
      ),
   };

   const target = budget.target as BudgetTarget;

   const budgetForList = {
      ...budget,
      periods: budget.currentPeriod ? [budget.currentPeriod] : [],
   };

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>Informações do Orçamento</CardTitle>
               <CardDescription>
                  Configurações e detalhes do orçamento
               </CardDescription>
               <CardAction className="flex gap-2">
                  <Button
                     onClick={() => setIsEditSheetOpen(true)}
                     size="sm"
                     variant="outline"
                  >
                     <Pencil className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.budgets.list-section.actions.edit-budget",
                     )}
                  </Button>
                  <DeleteBudget budget={budgetForList}>
                     <Button size="sm" variant="destructive">
                        <Trash2 className="size-4 mr-2" />
                        {translate(
                           "dashboard.routes.budgets.list-section.actions.delete",
                        )}
                     </Button>
                  </DeleteBudget>
               </CardAction>
            </CardHeader>
            <CardContent>
               <ItemGroup>
                  <Item>
                     <ItemContent>
                        <ItemTitle>Alvo</ItemTitle>
                        <ItemDescription>
                           {targetTypeLabels[target.type]}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Período</ItemTitle>
                        <ItemDescription>
                           {periodLabels[budget.periodType as string] ||
                              periodLabels.monthly}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Modo</ItemTitle>
                        <ItemDescription>
                           {modeLabels[budget.mode]}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Regime</ItemTitle>
                        <ItemDescription>
                           {regimeLabels[budget.regime]}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Acumulação (Rollover)</ItemTitle>
                        <ItemDescription>
                           {budget.rollover ? "Ativado" : "Desativado"}
                           {budget.rollover && budget.rolloverCap && (
                              <>
                                 {" "}
                                 (Limite:{" "}
                                 {formatCurrency(
                                    parseFloat(budget.rolloverCap),
                                 )}
                                 )
                              </>
                           )}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Status</ItemTitle>
                        <ItemDescription>
                           <Badge
                              variant={
                                 budget.isActive ? "default" : "secondary"
                              }
                           >
                              {budget.isActive ? "Ativo" : "Inativo"}
                           </Badge>
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Criado em</ItemTitle>
                        <ItemDescription>
                           {formatDate(budget.createdAt)}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
                  <ItemSeparator />

                  <Item>
                     <ItemContent>
                        <ItemTitle>Atualizado em</ItemTitle>
                        <ItemDescription>
                           {formatDate(budget.updatedAt)}
                        </ItemDescription>
                     </ItemContent>
                  </Item>
               </ItemGroup>
            </CardContent>
         </Card>

         <ManageBudgetSheet
            budget={budgetForList}
            onOpen={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
         />
      </>
   );
}
