"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";

export interface DatePickerProps {
   date?: Date;
   onSelect?: (date: Date | undefined) => void;
   placeholder?: string;
   className?: string;
}

export function DatePicker({
   date,
   onSelect,
   placeholder = "Pick a date",
   className,
}: DatePickerProps) {
   return (
      <Popover>
         <PopoverTrigger asChild>
            <Button
               variant="outline"
               data-empty={!date}
               className={cn(
                  "data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal",
                  className,
               )}
            >
               <CalendarIcon />
               {date ? format(date, "PPP") : <span>{placeholder}</span>}
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={date} onSelect={onSelect} />
         </PopoverContent>
      </Popover>
   );
}
