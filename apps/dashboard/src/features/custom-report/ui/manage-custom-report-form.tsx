import { Button } from "@packages/ui/components/button";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { MultiSelect } from "@packages/ui/components/multi-select";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import type { CustomReport } from "@/pages/custom-reports/ui/custom-reports-page";

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
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!report;

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

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: "Crie um novo relatório DRE para análise financeira",
         title: "Criar Relatório",
      };

      const editTexts = {
         description: `Edite o relatório "${report?.name || ""}"`,
         title: "Editar Relatório",
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode, report?.name]);

   const createReportMutation = useMutation(
      trpc.customReports.create.mutationOptions({
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

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
         bankAccountIds: [] as string[],
         categoryIds: [] as string[],
         costCenterIds: [] as string[],
         description: report?.description || "",
         endDate: report?.endDate ? new Date(report.endDate) : new Date(),
         name: report?.name || "",
         startDate: report?.startDate
            ? new Date(report.startDate)
            : new Date(new Date().setMonth(new Date().getMonth() - 1)),
         tagIds: [] as string[],
         type: (report?.type || "dre_gerencial") as
            | "dre_gerencial"
            | "dre_fiscal",
      },
      onSubmit: async ({ value }) => {
         if (!value.name) {
            return;
         }

         try {
            if (isEditMode && report) {
               await updateReportMutation.mutateAsync({
                  description: value.description || undefined,
                  id: report.id,
                  name: value.name,
               });
            } else {
               const filterConfig = {
                  bankAccountIds:
                     value.bankAccountIds.length > 0
                        ? value.bankAccountIds
                        : undefined,
                  categoryIds:
                     value.categoryIds.length > 0
                        ? value.categoryIds
                        : undefined,
                  costCenterIds:
                     value.costCenterIds.length > 0
                        ? value.costCenterIds
                        : undefined,
                  tagIds: value.tagIds.length > 0 ? value.tagIds : undefined,
               };

               const hasFilters =
                  filterConfig.bankAccountIds ||
                  filterConfig.categoryIds ||
                  filterConfig.costCenterIds ||
                  filterConfig.tagIds;

               await createReportMutation.mutateAsync({
                  description: value.description || undefined,
                  endDate: value.endDate.toISOString(),
                  filterConfig: hasFilters ? filterConfig : undefined,
                  name: value.name,
                  startDate: value.startDate.toISOString(),
                  type: value.type,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} report:`,
               error,
            );
         }
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
            <SheetTitle>{modeTexts.title}</SheetTitle>
            <SheetDescription>{modeTexts.description}</SheetDescription>
         </SheetHeader>
         <div className="grid gap-4 px-4">
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
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>Descrição (opcional)</FieldLabel>
                           <Textarea
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Descrição do relatório..."
                              rows={3}
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

            {!isEditMode && (
               <>
                  <FieldGroup>
                     <form.Field name="type">
                        {(field) => (
                           <Field>
                              <FieldLabel>Tipo de Relatório</FieldLabel>
                              <Select
                                 onValueChange={(value) =>
                                    field.handleChange(
                                       value as "dre_gerencial" | "dre_fiscal",
                                    )
                                 }
                                 value={field.state.value}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="dre_gerencial">
                                       DRE Gerencial
                                    </SelectItem>
                                    <SelectItem value="dre_fiscal">
                                       DRE Fiscal
                                    </SelectItem>
                                 </SelectContent>
                              </Select>
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>

                  <div className="grid grid-cols-2 gap-4">
                     <FieldGroup>
                        <form.Field name="startDate">
                           {(field) => (
                              <Field>
                                 <FieldLabel>Data Início</FieldLabel>
                                 <DatePicker
                                    className="w-full"
                                    date={field.state.value}
                                    onSelect={(date) => {
                                       if (date) {
                                          field.handleChange(date);
                                       }
                                    }}
                                    placeholder="Selecione a data"
                                 />
                              </Field>
                           )}
                        </form.Field>
                     </FieldGroup>

                     <FieldGroup>
                        <form.Field name="endDate">
                           {(field) => (
                              <Field>
                                 <FieldLabel>Data Fim</FieldLabel>
                                 <DatePicker
                                    className="w-full"
                                    date={field.state.value}
                                    onSelect={(date) => {
                                       if (date) {
                                          field.handleChange(date);
                                       }
                                    }}
                                    placeholder="Selecione a data"
                                 />
                              </Field>
                           )}
                        </form.Field>
                     </FieldGroup>
                  </div>

                  <FieldGroup>
                     <form.Field name="bankAccountIds">
                        {(field) => (
                           <Field>
                              <FieldLabel>
                                 Contas Bancárias (opcional)
                              </FieldLabel>
                              <MultiSelect
                                 onChange={(selected) =>
                                    field.handleChange(selected)
                                 }
                                 options={bankAccountOptions}
                                 placeholder="Todas as contas"
                                 selected={field.state.value}
                              />
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>

                  <FieldGroup>
                     <form.Field name="categoryIds">
                        {(field) => (
                           <Field>
                              <FieldLabel>Categorias (opcional)</FieldLabel>
                              <MultiSelect
                                 onChange={(selected) =>
                                    field.handleChange(selected)
                                 }
                                 options={categoryOptions}
                                 placeholder="Todas as categorias"
                                 selected={field.state.value}
                              />
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>

                  <FieldGroup>
                     <form.Field name="costCenterIds">
                        {(field) => (
                           <Field>
                              <FieldLabel>
                                 Centros de Custo (opcional)
                              </FieldLabel>
                              <MultiSelect
                                 onChange={(selected) =>
                                    field.handleChange(selected)
                                 }
                                 options={costCenterOptions}
                                 placeholder="Todos os centros de custo"
                                 selected={field.state.value}
                              />
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>

                  <FieldGroup>
                     <form.Field name="tagIds">
                        {(field) => (
                           <Field>
                              <FieldLabel>Tags (opcional)</FieldLabel>
                              <MultiSelect
                                 onChange={(selected) =>
                                    field.handleChange(selected)
                                 }
                                 options={tagOptions}
                                 placeholder="Todas as tags"
                                 selected={field.state.value}
                              />
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>
               </>
            )}
         </div>

         <SheetFooter>
            <form.Subscribe>
               {(state) => (
                  <Button
                     className="w-full"
                     disabled={
                        !state.canSubmit ||
                        state.isSubmitting ||
                        createReportMutation.isPending ||
                        updateReportMutation.isPending
                     }
                     type="submit"
                  >
                     {isEditMode ? "Salvar Alterações" : "Criar Relatório"}
                  </Button>
               )}
            </form.Subscribe>
         </SheetFooter>
      </form>
   );
}
