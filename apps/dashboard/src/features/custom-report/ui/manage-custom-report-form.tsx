import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Choicebox,
   ChoiceboxIndicator,
   ChoiceboxItem,
   ChoiceboxItemDescription,
   ChoiceboxItemHeader,
   ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import { DateRangePickerPopover } from "@packages/ui/components/date-range-picker-popover";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { MultiSelect } from "@packages/ui/components/multi-select";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Slider } from "@packages/ui/components/slider";
import { defineStepper } from "@packages/ui/components/stepper";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
   ArrowLeft,
   ArrowRight,
   BarChart3,
   Calculator,
   Check,
   Info,
   Target,
   TrendingUp,
   Users,
   Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import type { CustomReport } from "@/pages/custom-reports/ui/custom-reports-page";

type ReportType =
   | "dre_gerencial"
   | "dre_fiscal"
   | "budget_vs_actual"
   | "spending_trends"
   | "cash_flow_forecast"
   | "counterparty_analysis";

const reportTypeConfig = {
   budget_vs_actual: {
      description: "Compare orçamento planejado vs gastos reais por categoria",
      icon: Target,
      label: "Budget vs Atual",
   },
   cash_flow_forecast: {
      description:
         "Projeção de fluxo de caixa baseado em contas a pagar/receber",
      icon: Wallet,
      label: "Fluxo de Caixa",
   },
   counterparty_analysis: {
      description: "Análise de vendas por cliente e compras por fornecedor",
      icon: Users,
      label: "Análise de Parceiros",
   },
   dre_fiscal: {
      description: "DRE com formato fiscal para fins tributários",
      icon: Calculator,
      label: "DRE Fiscal",
   },
   dre_gerencial: {
      description: "Demonstração de resultado para análise gerencial interna",
      icon: BarChart3,
      label: "DRE Gerencial",
   },
   spending_trends: {
      description: "Tendências de gastos mensais e comparação ano a ano",
      icon: TrendingUp,
      label: "Tendências de Gastos",
   },
};

const { Stepper, useStepper } = defineStepper(
   { id: "type", title: "Tipo" },
   { id: "period", title: "Período" },
   { id: "filters", title: "Filtros" },
   { id: "details", title: "Detalhes" },
);

type Option = {
   label: string;
   value: string;
};

type ManageCustomReportFormProps = {
   report?: CustomReport;
};

export function ManageCustomReportForm({
   report,
}: ManageCustomReportFormProps) {
   const isEditMode = !!report;

   if (isEditMode) {
      return <EditReportForm report={report} />;
   }

   return (
      <Stepper.Provider className="h-full" variant="line">
         <CreateReportForm />
      </Stepper.Provider>
   );
}

function EditReportForm({ report }: { report: CustomReport }) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();

   const updateReportMutation = useMutation(
      trpc.customReports.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update report:", error);
         },
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         description: report.description || "",
         name: report.name || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name) return;
         await updateReportMutation.mutateAsync({
            description: value.description || undefined,
            id: report.id,
            name: value.name,
         });
      },
   });

   return (
      <form
         className="h-full flex flex-col"
         onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
         }}
      >
         <SheetHeader>
            <SheetTitle>Editar Relatório</SheetTitle>
            <SheetDescription>
               Edite o relatório &quot;{report.name}&quot;
            </SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4 flex-1">
            <FieldGroup>
               <form.Field name="name">
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>Nome</FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Ex: DRE Janeiro 2024"
                              value={field.state.value}
                           />
                           {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                           )}
                        </Field>
                     );
                  }}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="description">
                  {(field) => (
                     <Field>
                        <FieldLabel>Descrição (opcional)</FieldLabel>
                        <Textarea
                           onBlur={field.handleBlur}
                           onChange={(e) => field.handleChange(e.target.value)}
                           placeholder="Descrição do relatório..."
                           rows={3}
                           value={field.state.value}
                        />
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         </div>

         <SheetFooter>
            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        updateReportMutation.isPending
                     }
                     type="submit"
                  >
                     Salvar Alterações
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}

function CreateReportForm() {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const stepper = useStepper();

   const [formData, setFormData] = useState({
      bankAccountIds: [] as string[],
      categoryIds: [] as string[],
      costCenterIds: [] as string[],
      description: "",
      endDate: new Date(),
      forecastDays: 30,
      name: "",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      tagIds: [] as string[],
      type: "dre_gerencial" as ReportType,
   });

   const bankAccountsQuery = useQuery(trpc.bankAccounts.getAll.queryOptions());
   const categoriesQuery = useQuery(trpc.categories.getAll.queryOptions());
   const costCentersQuery = useQuery(trpc.costCenters.getAll.queryOptions());
   const tagsQuery = useQuery(trpc.tags.getAll.queryOptions());

   const bankAccountOptions: Option[] = useMemo(
      () =>
         (bankAccountsQuery.data || []).map((ba) => ({
            label: ba.name || ba.bank,
            value: ba.id,
         })),
      [bankAccountsQuery.data],
   );

   const categoryOptions: Option[] = useMemo(
      () =>
         (categoriesQuery.data || []).map((cat) => ({
            label: cat.name,
            value: cat.id,
         })),
      [categoriesQuery.data],
   );

   const costCenterOptions: Option[] = useMemo(
      () =>
         (costCentersQuery.data || []).map((cc) => ({
            label: cc.code ? `${cc.code} - ${cc.name}` : cc.name,
            value: cc.id,
         })),
      [costCentersQuery.data],
   );

   const tagOptions: Option[] = useMemo(
      () =>
         (tagsQuery.data || []).map((tag) => ({
            label: tag.name,
            value: tag.id,
         })),
      [tagsQuery.data],
   );

   const createReportMutation = useMutation(
      trpc.customReports.create.mutationOptions({
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const handleSubmit = async () => {
      if (!formData.name) return;

      const filterConfig = {
         bankAccountIds:
            formData.bankAccountIds.length > 0
               ? formData.bankAccountIds
               : undefined,
         categoryIds:
            formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
         costCenterIds:
            formData.costCenterIds.length > 0
               ? formData.costCenterIds
               : undefined,
         tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
      };

      const hasFilters =
         filterConfig.bankAccountIds ||
         filterConfig.categoryIds ||
         filterConfig.costCenterIds ||
         filterConfig.tagIds;

      await createReportMutation.mutateAsync({
         description: formData.description || undefined,
         endDate: formData.endDate.toISOString(),
         filterConfig: hasFilters ? filterConfig : undefined,
         forecastDays:
            formData.type === "cash_flow_forecast"
               ? formData.forecastDays
               : undefined,
         name: formData.name,
         startDate: formData.startDate.toISOString(),
         type: formData.type,
      });
   };

   const canProceed = () => {
      switch (stepper.current.id) {
         case "type":
            return !!formData.type;
         case "period":
            return !!formData.startDate && !!formData.endDate;
         case "filters":
            return true;
         case "details":
            return !!formData.name;
         default:
            return false;
      }
   };

   return (
      <div className="h-full flex flex-col">
         <SheetHeader>
            <SheetTitle>Criar Relatório</SheetTitle>
            <SheetDescription>
               Crie um novo relatório para análise financeira
            </SheetDescription>
         </SheetHeader>

         <div className="px-4 py-2">
            <Stepper.Navigation>
               <Stepper.Step of="type">
                  <Stepper.Title>Tipo</Stepper.Title>
               </Stepper.Step>
               <Stepper.Step of="period">
                  <Stepper.Title>Período</Stepper.Title>
               </Stepper.Step>
               <Stepper.Step of="filters">
                  <Stepper.Title>Filtros</Stepper.Title>
               </Stepper.Step>
               <Stepper.Step of="details">
                  <Stepper.Title>Detalhes</Stepper.Title>
               </Stepper.Step>
            </Stepper.Navigation>
         </div>

         <div className="flex-1 overflow-y-auto px-4">
            {stepper.switch({
               details: () => (
                  <div className="grid gap-4">
                     <FieldGroup>
                        <Field>
                           <FieldLabel>Nome</FieldLabel>
                           <Input
                              onChange={(e) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                 }))
                              }
                              placeholder="Ex: DRE Janeiro 2024"
                              value={formData.name}
                           />
                        </Field>
                     </FieldGroup>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Descrição (opcional)</FieldLabel>
                           <Textarea
                              onChange={(e) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                 }))
                              }
                              placeholder="Descrição do relatório..."
                              rows={3}
                              value={formData.description}
                           />
                        </Field>
                     </FieldGroup>

                     <Alert>
                        <Info className="size-4" />
                        <AlertTitle>Resumo do Relatório</AlertTitle>
                        <AlertDescription>
                           <div className="space-y-1">
                              <p>
                                 <span className="font-medium">Tipo:</span>{" "}
                                 {reportTypeConfig[formData.type].label}
                              </p>
                              <p>
                                 <span className="font-medium">Período:</span>{" "}
                                 {formData.startDate.toLocaleDateString()} -{" "}
                                 {formData.endDate.toLocaleDateString()}
                              </p>
                              {formData.type === "cash_flow_forecast" && (
                                 <p>
                                    <span className="font-medium">
                                       Projeção:
                                    </span>{" "}
                                    {formData.forecastDays} dias
                                 </p>
                              )}
                           </div>
                        </AlertDescription>
                     </Alert>
                  </div>
               ),
               filters: () => (
                  <div className="grid gap-4">
                     <p className="text-sm text-muted-foreground">
                        Aplique filtros opcionais para refinar os dados do
                        relatório. Se nenhum filtro for selecionado, todas as
                        transações serão consideradas.
                     </p>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Contas Bancárias</FieldLabel>
                           <MultiSelect
                              onChange={(selected) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    bankAccountIds: selected,
                                 }))
                              }
                              options={bankAccountOptions}
                              placeholder="Todas as contas"
                              selected={formData.bankAccountIds}
                           />
                           <FieldDescription>
                              Opcional. Filtre por contas bancárias específicas.
                           </FieldDescription>
                        </Field>
                     </FieldGroup>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Categorias</FieldLabel>
                           <MultiSelect
                              onChange={(selected) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    categoryIds: selected,
                                 }))
                              }
                              options={categoryOptions}
                              placeholder="Todas as categorias"
                              selected={formData.categoryIds}
                           />
                           <FieldDescription>
                              Opcional. Filtre por categorias específicas.
                           </FieldDescription>
                        </Field>
                     </FieldGroup>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Centros de Custo</FieldLabel>
                           <MultiSelect
                              onChange={(selected) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    costCenterIds: selected,
                                 }))
                              }
                              options={costCenterOptions}
                              placeholder="Todos os centros de custo"
                              selected={formData.costCenterIds}
                           />
                           <FieldDescription>
                              Opcional. Filtre por centros de custo específicos.
                           </FieldDescription>
                        </Field>
                     </FieldGroup>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Tags</FieldLabel>
                           <MultiSelect
                              onChange={(selected) =>
                                 setFormData((prev) => ({
                                    ...prev,
                                    tagIds: selected,
                                 }))
                              }
                              options={tagOptions}
                              placeholder="Todas as tags"
                              selected={formData.tagIds}
                           />
                           <FieldDescription>
                              Opcional. Filtre por tags específicas.
                           </FieldDescription>
                        </Field>
                     </FieldGroup>
                  </div>
               ),
               period: () => (
                  <div className="grid gap-4">
                     <p className="text-sm text-muted-foreground">
                        Selecione o período de análise do relatório.
                     </p>

                     <FieldGroup>
                        <Field>
                           <FieldLabel>Período</FieldLabel>
                           <DateRangePickerPopover
                              className="w-full justify-start"
                              endDate={formData.endDate}
                              onRangeChange={({ startDate, endDate }) => {
                                 if (startDate && endDate) {
                                    setFormData((prev) => ({
                                       ...prev,
                                       endDate,
                                       startDate,
                                    }));
                                 }
                              }}
                              placeholder="Selecione o período"
                              startDate={formData.startDate}
                           />
                        </Field>
                     </FieldGroup>

                     {formData.type === "cash_flow_forecast" && (
                        <FieldGroup>
                           <Field>
                              <FieldLabel>
                                 Dias de Projeção: {formData.forecastDays}
                              </FieldLabel>
                              <Slider
                                 max={365}
                                 min={7}
                                 onValueChange={(values) => {
                                    const newValue = values[0];
                                    if (newValue !== undefined) {
                                       setFormData((prev) => ({
                                          ...prev,
                                          forecastDays: newValue,
                                       }));
                                    }
                                 }}
                                 step={1}
                                 value={[formData.forecastDays]}
                              />
                              <span className="text-xs text-muted-foreground">
                                 Projeção de {formData.forecastDays} dias a
                                 partir da data inicial
                              </span>
                           </Field>
                        </FieldGroup>
                     )}
                  </div>
               ),
               type: () => (
                  <div className="grid gap-4">
                     <p className="text-sm text-muted-foreground">
                        Selecione o tipo de relatório que deseja criar.
                     </p>
                     <Choicebox
                        className="grid grid-cols-1 gap-2"
                        onValueChange={(value) =>
                           setFormData((prev) => ({
                              ...prev,
                              type: value as ReportType,
                           }))
                        }
                        value={formData.type}
                     >
                        {(
                           Object.entries(reportTypeConfig) as [
                              ReportType,
                              (typeof reportTypeConfig)[ReportType],
                           ][]
                        ).map(([value, config]) => {
                           const Icon = config.icon;
                           return (
                              <ChoiceboxItem
                                 id={value}
                                 key={value}
                                 value={value}
                              >
                                 <div className="flex items-center gap-3 p-1">
                                    <Icon className="size-5 text-muted-foreground shrink-0" />
                                    <ChoiceboxItemHeader className="flex-1 min-w-0">
                                       <ChoiceboxItemTitle className="text-sm">
                                          {config.label}
                                       </ChoiceboxItemTitle>
                                       <ChoiceboxItemDescription className="text-xs">
                                          {config.description}
                                       </ChoiceboxItemDescription>
                                    </ChoiceboxItemHeader>
                                 </div>
                                 <ChoiceboxIndicator id={value} />
                              </ChoiceboxItem>
                           );
                        })}
                     </Choicebox>
                  </div>
               ),
            })}
         </div>

         <SheetFooter className="px-4">
            <div className="flex w-full gap-2">
               {!stepper.isFirst && (
                  <Button
                     className="flex-1"
                     onClick={stepper.prev}
                     type="button"
                     variant="outline"
                  >
                     <ArrowLeft className="size-4" />
                     Voltar
                  </Button>
               )}
               {stepper.isLast ? (
                  <Button
                     className="flex-1"
                     disabled={!canProceed() || createReportMutation.isPending}
                     onClick={handleSubmit}
                     type="button"
                  >
                     <Check className="size-4" />
                     Criar Relatório
                  </Button>
               ) : (
                  <Button
                     className="flex-1"
                     disabled={!canProceed()}
                     onClick={stepper.next}
                     type="button"
                  >
                     Próximo
                     <ArrowRight className="size-4" />
                  </Button>
               )}
            </div>
         </SheetFooter>
      </div>
   );
}
