import type { BillWithRelations } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import {
   Field,
   FieldDescription,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { getRandomColor } from "@packages/utils/colors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useTRPC } from "@/integrations/clients";

type Bill = BillWithRelations;

type ChangeBillCategoryFormProps = {
   bill: Bill;
   onSuccess?: () => void;
};

export function ChangeBillCategoryForm({
   bill,
   onSuccess,
}: ChangeBillCategoryFormProps) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
      bill.categoryId || "",
   );

   const { data: allCategories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   // Filter categories based on bill type
   const categories = allCategories.filter((cat) => {
      if (!cat.transactionTypes || cat.transactionTypes.length === 0) {
         return true;
      }
      return cat.transactionTypes.includes(bill.type as "income" | "expense");
   });

   const updateBillMutation = useMutation(
      trpc.bills.update.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao atualizar categoria");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getById.queryKey({ id: bill.id }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bills.getAllPaginated.queryKey(),
            });
            toast.success("Categoria atualizada com sucesso");
            onSuccess?.();
         },
      }),
   );

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao criar categoria");
         },
         onSuccess: (data) => {
            if (!data) return;
            setSelectedCategoryId(data.id);
            toast.success(`Categoria "${data.name}" criada`);
         },
      }),
   );

   const handleCreateCategory = useCallback(
      (name: string) => {
         createCategoryMutation.mutate({
            color: getRandomColor(),
            name,
            transactionTypes: [bill.type as "income" | "expense"],
         });
      },
      [createCategoryMutation.mutate, bill.type],
   );

   const handleSubmit = () => {
      if (!selectedCategoryId) {
         toast.error("Selecione uma categoria");
         return;
      }

      updateBillMutation.mutate({
         data: {
            categoryId: selectedCategoryId,
         },
         id: bill.id,
      });
   };

   const categoryOptions = categories.map((category) => ({
      icon: (
         <div
            className="flex size-4 items-center justify-center rounded"
            style={{ backgroundColor: category.color }}
         >
            <IconDisplay iconName={category.icon as IconName} size={10} />
         </div>
      ),
      label: category.name,
      value: category.id,
   }));

   const isLoading =
      updateBillMutation.isPending || createCategoryMutation.isPending;

   return (
      <>
         <SheetHeader>
            <SheetTitle>
               {translate(
                  "dashboard.routes.bills.features.change-category.title",
               )}
            </SheetTitle>
            <SheetDescription>
               {translate(
                  "dashboard.routes.bills.features.change-category.description",
               )}
            </SheetDescription>
         </SheetHeader>

         <div className="px-4 flex-1 overflow-y-auto">
            <div className="space-y-4 py-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.category.label")}
                     </FieldLabel>
                     <Combobox
                        className="w-full justify-between"
                        createLabel={translate("common.form.category.create")}
                        disabled={isLoading}
                        emptyMessage={translate(
                           "common.form.search.no-results",
                        )}
                        onCreate={handleCreateCategory}
                        onValueChange={(value) =>
                           setSelectedCategoryId(value || "")
                        }
                        options={categoryOptions}
                        placeholder={translate(
                           "common.form.category.placeholder",
                        )}
                        searchPlaceholder={translate(
                           "common.form.search.label",
                        )}
                        value={selectedCategoryId}
                     />
                     <FieldDescription>
                        {translate("common.form.category.description")}
                     </FieldDescription>
                  </Field>
               </FieldGroup>
            </div>
         </div>

         <SheetFooter className="px-4">
            <Button
               className="w-full"
               disabled={isLoading || !selectedCategoryId}
               onClick={handleSubmit}
            >
               {isLoading
                  ? translate("common.actions.loading")
                  : translate("common.actions.save")}
            </Button>
         </SheetFooter>
      </>
   );
}
