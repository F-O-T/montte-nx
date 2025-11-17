export type RecurrencePattern =
   | "monthly"
   | "quarterly"
   | "semiannual"
   | "annual";

export interface RecurrenceConfig {
   pattern: RecurrencePattern;
   baseDate: Date;
}

/**
 * Calculate the next due date based on recurrence pattern
 */
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

/**
 * Get human-readable label for recurrence pattern
 */
export function getRecurrenceLabel(pattern: RecurrencePattern): string {
   const labels: Record<RecurrencePattern, string> = {
      annual: "Anual",
      monthly: "Mensal",
      quarterly: "Trimestral",
      semiannual: "Semestral",
   };

   return labels[pattern];
}

/**
 * Get all available recurrence patterns
 */
export function getRecurrencePatterns(): RecurrencePattern[] {
   return ["monthly", "quarterly", "semiannual", "annual"];
}

/**
 * Get the default number of future bills to generate based on recurrence pattern
 */
export function getDefaultFutureOccurrences(
   pattern: RecurrencePattern,
): number {
   const defaults: Record<RecurrencePattern, number> = {
      annual: 5, // 5 years ahead
      monthly: 12, // 1 year ahead
      quarterly: 8, // 2 years ahead
      semiannual: 6, // 3 years ahead
   };

   return defaults[pattern];
}

/**
 * Generate multiple future dates based on recurrence pattern
 */
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
