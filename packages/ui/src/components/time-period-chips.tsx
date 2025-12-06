"use client";

import { cn } from "@packages/ui/lib/utils";
import {
   endOfDay,
   endOfMonth,
   endOfWeek,
   startOfDay,
   startOfMonth,
   startOfWeek,
   subMonths,
} from "date-fns";
import {
   CalendarDays,
   CalendarRange,
   Clock,
   History,
   Infinity as InfinityIcon,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

export type TimePeriod =
   | "all-time"
   | "today"
   | "this-week"
   | "this-month"
   | "last-month";

export interface TimePeriodDateRange {
   startDate: Date | null;
   endDate: Date | null;
   selectedMonth: Date;
}

export interface TimePeriodChipsProps {
   value: TimePeriod | null;
   onValueChange: (
      value: TimePeriod | null,
      dateRange: TimePeriodDateRange,
   ) => void;
   className?: string;
   disabled?: boolean;
   size?: "sm" | "default" | "lg";
}

const PERIODS: {
   value: TimePeriod;
   label: string;
   icon: React.ComponentType<{ className?: string }>;
}[] = [
   { icon: InfinityIcon, label: "Todo Período", value: "all-time" },
   { icon: Clock, label: "Hoje", value: "today" },
   { icon: CalendarRange, label: "Esta Semana", value: "this-week" },
   { icon: CalendarDays, label: "Este Mês", value: "this-month" },
   { icon: History, label: "Mês Passado", value: "last-month" },
];

export function getDateRangeForPeriod(period: TimePeriod): TimePeriodDateRange {
   const today = new Date();

   switch (period) {
      case "all-time":
         return {
            endDate: null,
            selectedMonth: today,
            startDate: null,
         };
      case "today":
         return {
            endDate: endOfDay(today),
            selectedMonth: today,
            startDate: startOfDay(today),
         };
      case "this-week":
         return {
            endDate: endOfWeek(today, { weekStartsOn: 1 }),
            selectedMonth: today,
            startDate: startOfWeek(today, { weekStartsOn: 1 }),
         };
      case "this-month":
         return {
            endDate: endOfMonth(today),
            selectedMonth: today,
            startDate: startOfMonth(today),
         };
      case "last-month": {
         const lastMonth = subMonths(today, 1);
         return {
            endDate: endOfMonth(lastMonth),
            selectedMonth: lastMonth,
            startDate: startOfMonth(lastMonth),
         };
      }
      default:
         return {
            endDate: null,
            selectedMonth: today,
            startDate: null,
         };
   }
}

export function TimePeriodChips({
   value,
   onValueChange,
   className,
   disabled = false,
   size = "default",
}: TimePeriodChipsProps) {
   const handleValueChange = (newValue: string) => {
      if (!newValue) {
         onValueChange(null, {
            endDate: null,
            selectedMonth: new Date(),
            startDate: null,
         });
         return;
      }

      const period = newValue as TimePeriod;
      const dateRange = getDateRangeForPeriod(period);
      onValueChange(period, dateRange);
   };

   return (
      <ToggleGroup
         className={cn("flex-wrap justify-start", className)}
         disabled={disabled}
         onValueChange={handleValueChange}
         size={size}
         spacing={2}
         type="single"
         value={value || ""}
         variant="outline"
      >
         {PERIODS.map((period) => {
            const Icon = period.icon;
            return (
               <ToggleGroupItem
                  aria-label={`Toggle ${period.value}`}
                  className={cn(
                     "gap-1.5 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:*:[svg]:stroke-primary",
                     size === "sm" && "text-xs px-2 h-7",
                  )}
                  key={period.value}
                  value={period.value}
               >
                  <Icon className={cn("size-3.5", size === "sm" && "size-3")} />
                  <span className="hidden sm:inline">{period.label}</span>
                  <span className="sm:hidden">
                     {period.value === "all-time"
                        ? "Todos"
                        : period.value === "today"
                          ? "Hoje"
                          : period.value === "this-week"
                            ? "Semana"
                            : period.value === "this-month"
                              ? "Mês"
                              : "Anterior"}
                  </span>
               </ToggleGroupItem>
            );
         })}
      </ToggleGroup>
   );
}

export { PERIODS as TIME_PERIODS };
