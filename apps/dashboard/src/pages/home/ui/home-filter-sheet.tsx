import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";

type HomeFilterSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   onPeriodChange: (startDate: Date, endDate: Date) => void;
};

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

export function HomeFilterSheet({
   isOpen,
   onOpenChange,
   onPeriodChange,
}: HomeFilterSheetProps) {
   const handlePresetChange = (value: string) => {
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
      onOpenChange(false);
   };

   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent className="" side="right">
            <SheetHeader>
               <SheetTitle>Filter by Date Range</SheetTitle>
               <SheetDescription>
                  Select a time period to filter your financial data.
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>Time Period</FieldLabel>
                     <Select onValueChange={handlePresetChange}>
                        <SelectTrigger>
                           <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="current_month">
                              Current Month
                           </SelectItem>
                           <SelectItem value="last_month">
                              Last Month
                           </SelectItem>
                           <SelectItem value="current_year">
                              Current Year
                           </SelectItem>
                           <SelectItem value="last_year">Last Year</SelectItem>
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>
            </div>
         </SheetContent>
      </Sheet>
   );
}
