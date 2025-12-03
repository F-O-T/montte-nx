import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useState } from "react";

type Category = {
   id: string;
   name: string;
   color: string;
   icon: string | null;
};

type ChangeCategorySheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   categories: Category[];
   selectedCount: number;
   onConfirm: (categoryId: string) => void;
   isLoading?: boolean;
};

export function ChangeCategorySheet({
   isOpen,
   onOpenChange,
   categories,
   selectedCount,
   onConfirm,
   isLoading = false,
}: ChangeCategorySheetProps) {
   const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

   const categoryOptions = categories.map((category) => ({
      label: category.name,
      value: category.id,
   }));

   const handleConfirm = () => {
      if (selectedCategoryId) {
         onConfirm(selectedCategoryId);
         setSelectedCategoryId("");
      }
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         setSelectedCategoryId("");
      }
      onOpenChange(open);
   };

   return (
      <Sheet onOpenChange={handleOpenChange} open={isOpen}>
         <SheetContent side="right">
            <SheetHeader>
               <SheetTitle>Alterar Categoria</SheetTitle>
               <SheetDescription>
                  Selecione a categoria para {selectedCount}{" "}
                  {selectedCount === 1 ? "transação" : "transações"}.
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4 py-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.category.label")}
                     </FieldLabel>
                     <Combobox
                        emptyMessage={translate(
                           "common.form.search.no-results",
                        )}
                        onValueChange={setSelectedCategoryId}
                        options={categoryOptions}
                        placeholder={translate(
                           "common.form.category.placeholder",
                        )}
                        searchPlaceholder={translate(
                           "common.form.search.label",
                        )}
                        value={selectedCategoryId}
                     />
                  </Field>
               </FieldGroup>
            </div>
            <SheetFooter className="px-4">
               <Button
                  className="w-full"
                  disabled={!selectedCategoryId || isLoading}
                  onClick={handleConfirm}
               >
                  {isLoading ? "Salvando..." : "Confirmar"}
               </Button>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
}
