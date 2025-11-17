export type RecurrencePattern =
   | "monthly"
   | "quarterly"
   | "semiannual"
   | "annual";

export interface RecurrenceConfig {
   pattern: RecurrencePattern;
   baseDate: Date;
}

export function getNextDueDate(
   currentDueDate: Date,
   pattern: RecurrencePattern,
): Date {
   const nextDate = new Date(currentDueDate);

   switch (pattern) {
      case "monthly":
         nextDate.setMonth(nextDate.getMonth() + 1);
         break;
      case "quarterly":
         nextDate.setMonth(nextDate.getMonth() + 3);
         break;
      case "semiannual":
         nextDate.setMonth(nextDate.getMonth() + 6);
         break;
      case "annual":
         nextDate.setFullYear(nextDate.getFullYear() + 1);
         break;
   }

   return nextDate;
}

export function getRecurrenceLabel(pattern: RecurrencePattern): string {
   const labels: Record<RecurrencePattern, string> = {
      annual: "Anual",
      monthly: "Mensal",
      quarterly: "Trimestral",
      semiannual: "Semestral",
   };

   return labels[pattern];
}

export function getRecurrencePatterns(): RecurrencePattern[] {
   return ["monthly", "quarterly", "semiannual", "annual"];
}

export function getDefaultFutureOccurrences(
   pattern: RecurrencePattern,
): number {
   const defaults: Record<RecurrencePattern, number> = {
      annual: 5,
      monthly: 12,
      quarterly: 8,
      semiannual: 6,
   };

   return defaults[pattern];
}

export function generateFutureDates(
   baseDate: Date,
   pattern: RecurrencePattern,
   count?: number,
): Date[] {
   const occurrences = count ?? getDefaultFutureOccurrences(pattern);
   const dates: Date[] = [];
   let currentDate = new Date(baseDate);

   for (let i = 0; i < occurrences; i++) {
      currentDate = getNextDueDate(currentDate, pattern);
      dates.push(new Date(currentDate));
   }

   return dates;
}
