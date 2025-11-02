"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@packages/ui/lib/utils";
import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";

export interface ComboboxOption {
   value: string;
   label: string;
}

interface ComboboxProps {
   options: ComboboxOption[];
   value?: string;
   onValueChange?: (value: string) => void;
   placeholder?: string;
   searchPlaceholder?: string;
   emptyMessage?: string;
   className?: string;
   disabled?: boolean;
}

export function Combobox({
   options,
   value,
   onValueChange,
   placeholder = "Select option...",
   searchPlaceholder = "Search...",
   emptyMessage = "No option found.",
   className,
   disabled = false,
}: ComboboxProps) {
   const [open, setOpen] = React.useState(false);

   const selectedOption = options.find((option) => option.value === value);

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               variant="outline"
               role="combobox"
               aria-expanded={open}
               className={cn("w-[200px] justify-between", className)}
               disabled={disabled}
            >
               {selectedOption ? selectedOption.label : placeholder}
               <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-[200px] p-0">
            <Command>
               <CommandInput placeholder={searchPlaceholder} />
               <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                     {options.map((option) => (
                        <CommandItem
                           key={option.value}
                           value={option.value}
                           onSelect={(currentValue) => {
                              onValueChange?.(
                                 currentValue === value ? "" : currentValue,
                              );
                              setOpen(false);
                           }}
                        >
                           <CheckIcon
                              className={cn(
                                 "mr-2 h-4 w-4",
                                 value === option.value
                                    ? "opacity-100"
                                    : "opacity-0",
                              )}
                           />
                           {option.label}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
