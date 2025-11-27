export type CategorySplit = {
   categoryId: string;
   value: number;
   splitType: "amount";
};

const TOLERANCE_CENTS = 1;

export function validateCategorySplits(
   splits: CategorySplit[] | null | undefined,
   categoryIds: string[],
   totalAmountInCents: number,
): { isValid: boolean; errors: string[] } {
   if (!splits || splits.length === 0) {
      return { errors: [], isValid: true };
   }

   const errors: string[] = [];

   const invalidIds = splits.filter((s) => !categoryIds.includes(s.categoryId));
   if (invalidIds.length > 0) {
      errors.push("Split contains invalid category IDs");
   }

   if (splits.some((s) => s.value < 0)) {
      errors.push("Split values cannot be negative");
   }

   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   if (Math.abs(totalAmountInCents - sum) > TOLERANCE_CENTS) {
      errors.push(
         `Split sum (${sum / 100}) does not match total (${totalAmountInCents / 100})`,
      );
   }

   return { errors, isValid: errors.length === 0 };
}

export function isSplitSumValid(
   splits: CategorySplit[],
   totalAmountInCents: number,
): boolean {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return Math.abs(totalAmountInCents - sum) <= TOLERANCE_CENTS;
}

export function getRemainingAmount(
   splits: CategorySplit[],
   totalAmountInCents: number,
): number {
   const sum = splits.reduce((acc, s) => acc + s.value, 0);
   return totalAmountInCents - sum;
}
