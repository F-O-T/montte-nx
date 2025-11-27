import { Label } from "@packages/ui/components/label";
import { MoneyInput } from "@packages/ui/components/money-input";
import { Switch } from "@packages/ui/components/switch";
import {
   type CategorySplit,
   getRemainingAmount,
   isSplitSumValid,
} from "@packages/utils/split";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";

type Category = {
   id: string;
   name: string;
   icon: string | null;
   color: string;
};

type CategorySplitInputProps = {
   categories: Category[];
   selectedCategoryIds: string[];
   splits: CategorySplit[] | null;
   totalAmount: number;
   enabled: boolean;
   onEnabledChange: (enabled: boolean) => void;
   onChange: (splits: CategorySplit[] | null) => void;
};

export function CategorySplitInput({
   categories,
   selectedCategoryIds,
   splits,
   totalAmount,
   enabled,
   onEnabledChange,
   onChange,
}: CategorySplitInputProps) {
   const selectedCategories = categories.filter((c) =>
      selectedCategoryIds.includes(c.id),
   );

   if (selectedCategories.length <= 1) {
      return null;
   }

   const getSyncedSplits = (): CategorySplit[] => {
      return selectedCategoryIds.map((categoryId) => {
         const existing = splits?.find((s) => s.categoryId === categoryId);
         if (existing) return existing;
         return { categoryId, splitType: "amount" as const, value: 0 };
      });
   };

   const currentSplits = enabled ? getSyncedSplits() : null;

   const handleToggle = (checked: boolean) => {
      onEnabledChange(checked);
      if (!checked) {
         onChange(null);
         return;
      }
      onChange(getSyncedSplits());
   };

   const handleValueChange = (categoryId: string, newValue: number) => {
      if (!currentSplits) return;

      const value = Math.max(0, newValue);

      const updatedSplits = currentSplits.map((s) => {
         if (s.categoryId !== categoryId) return s;
         return { ...s, value };
      });

      onChange(updatedSplits);
   };

   const isValid = currentSplits
      ? isSplitSumValid(currentSplits, totalAmount)
      : true;
   const remainingAmount = currentSplits
      ? getRemainingAmount(currentSplits, totalAmount)
      : totalAmount;

   return (
      <div className="space-y-3 rounded-lg border p-3">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Switch
                  checked={enabled}
                  id="split-toggle"
                  onCheckedChange={handleToggle}
               />
               <Label className="text-sm font-medium" htmlFor="split-toggle">
                  Dividir valor entre categorias
               </Label>
            </div>
         </div>

         {currentSplits && (
            <>
               <div className="flex justify-end">
                  <span
                     className={`text-sm ${
                        !isValid
                           ? "text-destructive font-medium"
                           : "text-green-600 font-medium"
                     }`}
                  >
                     {isValid
                        ? "Valores conferem"
                        : remainingAmount > 0
                          ? `Falta: R$ ${(remainingAmount / 100).toFixed(2)}`
                          : `Excede: R$ ${(Math.abs(remainingAmount) / 100).toFixed(2)}`}
                  </span>
               </div>

               {selectedCategories.map((category) => {
                  const split = currentSplits.find(
                     (s) => s.categoryId === category.id,
                  );
                  if (!split) return null;
                  return (
                     <div className="flex items-center gap-2" key={category.id}>
                        <div className="flex min-w-[140px] items-center gap-2">
                           <div
                              className="flex size-6 items-center justify-center rounded"
                              style={{ backgroundColor: category.color }}
                           >
                              <IconDisplay
                                 iconName={category.icon as IconName | null}
                                 size={14}
                              />
                           </div>
                           <span className="truncate text-sm">
                              {category.name}
                           </span>
                        </div>

                        <MoneyInput
                           className="flex-1"
                           onChange={(v) =>
                              handleValueChange(category.id, v || 0)
                           }
                           placeholder="0,00"
                           value={split.value}
                           valueInCents
                        />
                     </div>
                  );
               })}
            </>
         )}
      </div>
   );
}
