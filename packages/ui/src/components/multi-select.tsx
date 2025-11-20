"use client";

import { Badge } from "@packages/ui/components/badge";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";

export type Option = {
   label: string;
   value: string;
   icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
};

interface MultiSelectProps {
   options: Option[];
   selected: string[];
   onChange: (selected: string[]) => void;
   className?: string;
   placeholder?: string;
   emptyMessage?: string;
}

export function MultiSelect({
   options,
   selected,
   onChange,
   className,
   placeholder = "Select options...",
   emptyMessage = "No results found.",
}: MultiSelectProps) {
   const [open, setOpen] = React.useState(false);

   const handleUnselect = (item: string) => {
      onChange(selected.filter((i) => i !== item));
   };

   return (
      <Popover onOpenChange={setOpen} open={open}>
         <PopoverTrigger asChild>
            <Button
               aria-expanded={open}
               className={cn(
                  "w-full justify-between hover:bg-background/50",
                  selected.length > 0 ? "h-auto py-2" : "h-10",
                  className,
               )}
               onClick={() => setOpen(!open)}
               role="combobox"
               variant="outline"
            >
               <div className="flex flex-wrap gap-1">
                  {selected.length === 0 && (
                     <span className="text-muted-foreground font-normal">
                        {placeholder}
                     </span>
                  )}
                  {selected.map((item) => {
                     const option = options.find((o) => o.value === item);
                     return (
                        <Badge
                           className="mr-1"
                           key={item}
                           onClick={(e) => {
                              e.stopPropagation();
                              handleUnselect(item);
                           }}
                           variant="secondary"
                        >
                           {option?.icon &&
                           typeof option.icon === "function" ? (
                              <option.icon className="mr-1 h-3 w-3" />
                           ) : option?.icon ? (
                              <span className="mr-1">{option.icon}</span>
                           ) : null}
                           {option?.label || item}
                           <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" />
                        </Badge>
                     );
                  })}
               </div>
               <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent className="w-full p-0">
            <Command className={className}>
               <CommandInput placeholder="Search..." />
               <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                     {options.map((option) => (
                        <CommandItem
                           key={option.value}
                           onSelect={() => {
                              onChange(
                                 selected.includes(option.value)
                                    ? selected.filter(
                                         (item) => item !== option.value,
                                      )
                                    : [...selected, option.value],
                              );
                              setOpen(true);
                           }}
                           value={option.label}
                        >
                           <Check
                              className={cn(
                                 "mr-2 h-4 w-4",
                                 selected.includes(option.value)
                                    ? "opacity-100"
                                    : "opacity-0",
                              )}
                           />
                           {option?.icon &&
                           typeof option.icon === "function" ? (
                              <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                           ) : option?.icon ? (
                              <span className="mr-2 text-muted-foreground">
                                 {option.icon}
                              </span>
                           ) : null}
                           <span>{option.label}</span>
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </CommandList>
            </Command>
         </PopoverContent>
      </Popover>
   );
}
