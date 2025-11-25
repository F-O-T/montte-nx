"use client";

import {
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";

export type AutocompleteOption = Record<"value" | "label", string> &
   Record<string, string>;

interface AutocompleteProps {
   options: AutocompleteOption[];
   emptyMessage: string;
   value?: AutocompleteOption;
   onValueChange?: (value: AutocompleteOption) => void;
   isLoading?: boolean;
   disabled?: boolean;
   placeholder?: string;
   onBlur?: () => void;
}

export function Autocomplete({
   options,
   placeholder,
   emptyMessage,
   value,
   onValueChange,
   disabled,
   isLoading = false,
   onBlur,
}: AutocompleteProps) {
   const inputRef = useRef<HTMLInputElement>(null);
   const listRef = useRef<HTMLDivElement>(null);

   const [isOpen, setOpen] = useState(false);
   const [selected, setSelected] = useState<AutocompleteOption | undefined>(
      value,
   );
   const [inputValue, setInputValue] = useState<string>(value?.label || "");

   const handleInputValueChange = useCallback((newValue: string) => {
      setInputValue(newValue);
      if (listRef.current) {
         listRef.current.scrollTop = 0;
      }
   }, []);

   const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
         const input = inputRef.current;
         if (!input) {
            return;
         }

         if (!isOpen) {
            setOpen(true);
         }

         if (event.key === "Enter" && input.value !== "") {
            const optionToSelect = options.find(
               (option) => option.label === input.value,
            );
            if (optionToSelect) {
               setSelected(optionToSelect);
               onValueChange?.(optionToSelect);
            }
         }

         if (event.key === "Escape") {
            input.blur();
         }
      },
      [isOpen, options, onValueChange],
   );

   const handleBlur = useCallback(() => {
      setOpen(false);
      setInputValue(selected?.label || "");
      onBlur?.();
   }, [selected, onBlur]);

   const handleSelectOption = useCallback(
      (selectedOption: AutocompleteOption) => {
         setInputValue(selectedOption.label);

         setSelected(selectedOption);
         onValueChange?.(selectedOption);

         setTimeout(() => {
            inputRef?.current?.blur();
         }, 0);
      },
      [onValueChange],
   );

   return (
      <CommandPrimitive onKeyDown={handleKeyDown}>
         <div className="dark:bg-input/30 rounded-md border border-input">
            <CommandInput
               className="text-base border-0"
               disabled={disabled}
               onBlur={handleBlur}
               onFocus={() => setOpen(true)}
               onValueChange={isLoading ? undefined : handleInputValueChange}
               placeholder={placeholder}
               ref={inputRef}
               value={inputValue}
            />
         </div>
         <div className="relative mt-1">
            <div
               className={cn(
                  "animate-in fade-in-0 zoom-in-95 absolute top-0 z-10 w-full rounded-xl bg-popover outline-none border border-border shadow-md",
                  isOpen ? "block" : "hidden",
               )}
            >
               <CommandList className="rounded-lg" ref={listRef}>
                  {isLoading ? (
                     <CommandPrimitive.Loading>
                        <div className="p-1">
                           <Skeleton className="h-8 w-full" />
                        </div>
                     </CommandPrimitive.Loading>
                  ) : null}
                  {options.length > 0 && !isLoading ? (
                     <CommandGroup>
                        {options.map((option) => {
                           const isSelected = selected?.value === option.value;
                           return (
                              <CommandItem
                                 className={cn(
                                    "flex w-full items-center gap-2",
                                    !isSelected ? "pl-8" : null,
                                 )}
                                 key={option.value}
                                 onMouseDown={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                 }}
                                 onSelect={() => handleSelectOption(option)}
                                 value={option.label}
                              >
                                 {isSelected ? <Check className="w-4" /> : null}
                                 {option.label}
                              </CommandItem>
                           );
                        })}
                     </CommandGroup>
                  ) : null}
                  {!isLoading ? (
                     <CommandPrimitive.Empty className="select-none rounded-sm px-2 py-3 text-center text-sm">
                        {emptyMessage}
                     </CommandPrimitive.Empty>
                  ) : null}
               </CommandList>
            </div>
         </div>
      </CommandPrimitive>
   );
}
