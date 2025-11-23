"use client";

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
import { cn } from "@packages/ui/lib/utils";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import * as React from "react";

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
   onBlur?: React.FocusEventHandler<HTMLButtonElement>;
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
   onBlur,
}: ComboboxProps) {
   const [open, setOpen] = React.useState(false);

   const selectedOption = options.find((option) => option.value === value);

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className={cn("flex items-center gap-2", className)}
               disabled={disabled}
               onBlur={onBlur}
               role="combobox"
               variant="outline"
            >
               {selectedOption ? selectedOption.label : placeholder}
               <ChevronsUpDownIcon className="size-4" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className=" p-0">
            <Command>
               <CommandInput placeholder={searchPlaceholder} />
               <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                     {options.map((option) => (
                        <CommandItem
                           key={option.value}
                           onSelect={(currentValue) => {
                              onValueChange?.(
                                 currentValue === value ? "" : currentValue,
                              );
                              setOpen(false);
                           }}
                           value={option.value}
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
