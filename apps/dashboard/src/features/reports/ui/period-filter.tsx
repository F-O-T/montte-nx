import { Button } from "@packages/ui/components/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

export type PeriodPreset =
   | "current_month"
   | "last_month"
   | "current_year"
   | "last_year"
   | "custom";

interface PeriodFilterProps {
   onPeriodChange: (startDate: Date, endDate: Date) => void;
   defaultPreset?: PeriodPreset;
   initialStartDate?: Date;
   initialEndDate?: Date;
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function getLastMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
   const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
   return { end, start };
}

function getCurrentYearDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), 0, 1);
   const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
   return { end, start };
}

function getLastYearDates() {
   const now = new Date();
   const start = new Date(now.getFullYear() - 1, 0, 1);
   const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
   return { end, start };
}

export function PeriodFilter({
   onPeriodChange,
   defaultPreset = "current_month",
   initialStartDate,
   initialEndDate,
}: PeriodFilterProps) {
   const [preset, setPreset] = useState<PeriodPreset>(defaultPreset);
   const [customStartDate, setCustomStartDate] = useState<string>("");
   const [customEndDate, setCustomEndDate] = useState<string>("");

   const handlePresetChange = (value: PeriodPreset) => {
      setPreset(value);
      let dates;

      switch (value) {
         case "current_month":
            dates = getCurrentMonthDates();
            break;
         case "last_month":
            dates = getLastMonthDates();
            break;
         case "current_year":
            dates = getCurrentYearDates();
            break;
         case "last_year":
            dates = getLastYearDates();
            break;
         default:
            return;
      }

      onPeriodChange(dates.start, dates.end);
   };

   const handleCustomDateApply = () => {
      if (customStartDate && customEndDate) {
         const start = new Date(customStartDate);
         const end = new Date(customEndDate);
         end.setHours(23, 59, 59);
         onPeriodChange(start, end);
      }
   };

   return (
      <div className="flex flex-wrap items-end gap-4">
         <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Period</label>
            <Select onValueChange={handlePresetChange} value={preset}>
               <SelectTrigger>
                  <SelectValue placeholder="Select period" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Period</SelectItem>
               </SelectContent>
            </Select>
         </div>

         {preset === "custom" && (
            <>
               <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">
                     Start Date
                  </label>
                  <input
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                     onChange={(e) => setCustomStartDate(e.target.value)}
                     type="date"
                     value={customStartDate}
                  />
               </div>
               <div className="flex-1 min-w-[150px]">
                  <label className="text-sm font-medium mb-2 block">
                     End Date
                  </label>
                  <input
                     className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                     onChange={(e) => setCustomEndDate(e.target.value)}
                     type="date"
                     value={customEndDate}
                  />
               </div>
               <Button onClick={handleCustomDateApply}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Apply
               </Button>
            </>
         )}
      </div>
   );
}
