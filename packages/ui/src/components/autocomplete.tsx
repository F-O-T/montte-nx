"use client";

import {
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { Skeleton } from "@packages/ui/components/skeleton";
import { cn } from "@packages/ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";
import {
   type KeyboardEvent,
   useCallback,
   useMemo,
   useRef,
   useState,
} from "react";

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
   const [parentNode, setParentNode] = useState<HTMLDivElement | null>(null);

   const [isOpen, setOpen] = useState(false);
   const [selected, setSelected] = useState<AutocompleteOption | undefined>(
      value,
   );
   const [inputValue, setInputValue] = useState<string>(value?.label || "");

   const filteredOptions = useMemo(() => {
      const searchTerm = inputValue.trim().toLowerCase();
      if (!searchTerm) return options;
      return options.filter((option) =>
         option.label.toLowerCase().includes(searchTerm),
      );
   }, [options, inputValue]);

   const virtualizer = useVirtualizer({
      count: filteredOptions.length,
      estimateSize: () => 50,
      getScrollElement: () => parentNode,
      overscan: 5,
   });

   const virtualItems = virtualizer.getVirtualItems();

   const refCallback = useCallback((node: HTMLDivElement | null) => {
      if (node) {
         setParentNode(node);
      }
   }, []);

   const handleInputValueChange = useCallback(
      (newValue: string) => {
         setInputValue(newValue);
         if (parentNode) {
            parentNode.scrollTop = 0;
         }
      },
      [parentNode],
   );

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
            const optionToSelect = filteredOptions.find(
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
      [isOpen, filteredOptions, onValueChange],
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
               <CommandList className="rounded-lg" ref={refCallback}>
                  {isLoading ? (
                     <CommandPrimitive.Loading>
                        <div className="p-1">
                           <Skeleton className="h-8 w-full" />
                        </div>
                     </CommandPrimitive.Loading>
                  ) : null}
                  {filteredOptions.length > 0 && !isLoading ? (
                     <CommandGroup>
                        <div
                           style={{
                              height: virtualizer.getTotalSize(),
                              position: "relative",
                              width: "100%",
                           }}
                        >
                           {virtualItems.length > 0 ? (
                              <div
                                 style={{
                                    left: 0,
                                    position: "absolute",
                                    top: 0,
                                    transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
                                    width: "100%",
                                 }}
                              >
                                 {virtualItems.map((virtualRow) => {
                                    const option =
                                       filteredOptions[virtualRow.index];

                                    if (!option) return null;

                                    const isSelected =
                                       selected?.value === option.value;

                                    return (
                                       <CommandItem
                                          className={cn(
                                             "flex w-full items-start gap-2 py-1",
                                             !isSelected ? "pl-8" : null,
                                          )}
                                          key={option.value}
                                          onMouseDown={(event) => {
                                             event.preventDefault();
                                             event.stopPropagation();
                                          }}
                                          onSelect={() =>
                                             handleSelectOption(option)
                                          }
                                          ref={virtualizer.measureElement}
                                          value={option.label}
                                       >
                                          {isSelected ? (
                                             <Check className="w-4 shrink-0 mt-0.5" />
                                          ) : null}
                                          <span className="break-words">
                                             {option.label}
                                          </span>
                                       </CommandItem>
                                    );
                                 })}
                              </div>
                           ) : null}
                        </div>
                     </CommandGroup>
                  ) : null}
                  {!isLoading && filteredOptions.length === 0 ? (
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
