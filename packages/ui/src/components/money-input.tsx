"use client";

import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
   InputGroupText,
} from "@packages/ui/components/input-group";
import { centsToReais } from "@packages/utils/money";
import * as React from "react";

interface MoneyInputProps
   extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "onChange" | "value"
   > {
   value?: number | string;
   onChange?: (value: number | undefined) => void;
   placeholder?: string;
   className?: string;
   valueInCents?: boolean;
   locale?: string;
   debounceMs?: number;
}

// Custom debounce hook with proper typing
function useDebouncedCallback<T extends unknown[]>(
   callback: (...args: T) => void,
   delay: number,
): (...args: T) => void {
   const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);
   const callbackRef = React.useRef(callback);

   React.useEffect(() => {
      callbackRef.current = callback;
   }, [callback]);

   return React.useCallback(
      (...args: T) => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
         }, delay);
      },
      [delay],
   );
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
   (
      {
         value,
         onChange,
         placeholder = "0,00",
         className,
         valueInCents = true,
         locale = "pt-BR",
         debounceMs = 0,
         ...props
      },
      ref,
   ) => {
      const [displayValue, setDisplayValue] = React.useState<string>("");
      const inputRef = React.useRef<HTMLInputElement | null>(null);

      // Debounced onChange callback with correct typing
      const debouncedOnChange = useDebouncedCallback<[number | undefined]>(
         (value: number | undefined) => {
            onChange?.(value);
         },
         debounceMs,
      );

      const valueToDecimal = React.useCallback(
         (val: number | string | undefined): number => {
            if (val === undefined || val === "") {
               return 0;
            }

            const numValue =
               typeof val === "string" ? Number.parseFloat(val) : val;

            if (Number.isNaN(numValue)) {
               return 0;
            }

            return valueInCents ? centsToReais(numValue) : numValue;
         },
         [valueInCents],
      );

      // Format number with Brazilian locale
      const formatBrazilianNumber = (num: number): string => {
         const parts = num.toFixed(2).split(".");
         const integerPart = parts[0];
         const decimalPart = parts[1];

         if (!integerPart || !decimalPart) {
            return "0,00";
         }

         const formattedInteger = integerPart.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ".",
         );

         return `${formattedInteger},${decimalPart}`;
      };

      // Parse Brazilian format back to number
      const parseBrazilianNumber = (str: string): number => {
         const normalized = str.replace(/\./g, "").replace(",", ".");
         return Number.parseFloat(normalized);
      };

      // Format as user types - always mask the input
      const formatAsYouType = (inputValue: string): string => {
         // Remove all non-numeric characters except comma
         const cleaned = inputValue.replace(/[^\d,]/g, "");

         // Split by comma to handle integer and decimal parts
         const parts = cleaned.split(",");
         const integerPart = parts[0] || "";
         const decimalPart = parts[1] || "";

         // Add thousand separators to integer part
         const formattedInteger = integerPart.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ".",
         );

         // Limit decimal to 2 places
         const limitedDecimal = decimalPart.substring(0, 2);

         // Combine with comma if there's a decimal part
         if (parts.length > 1) {
            return `${formattedInteger},${limitedDecimal}`;
         }

         return formattedInteger;
      };

      // Initialize display value from prop value
      React.useEffect(() => {
         if (value === undefined || value === "") {
            setDisplayValue("");
         } else {
            const decimalValue = valueToDecimal(value);
            if (!Number.isNaN(decimalValue)) {
               setDisplayValue(formatBrazilianNumber(decimalValue));
            }
         }
      }, [value, valueToDecimal]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const inputValue = e.target.value;
         const cursorPosition = e.target.selectionStart || 0;

         if (!inputValue.trim()) {
            setDisplayValue("");
            if (debounceMs > 0) {
               debouncedOnChange(undefined);
            } else {
               onChange?.(undefined);
            }
            return;
         }

         // Format as you type
         const formatted = formatAsYouType(inputValue);
         setDisplayValue(formatted);

         // Calculate new cursor position after formatting
         const addedDots =
            (formatted.match(/\./g) || []).length -
            (displayValue.match(/\./g) || []).length;
         const newCursorPosition = cursorPosition + addedDots;

         // Set cursor position after state update
         requestAnimationFrame(() => {
            if (inputRef.current) {
               inputRef.current.setSelectionRange(
                  newCursorPosition,
                  newCursorPosition,
               );
            }
         });

         // Parse and send to parent
         const decimalValue = parseBrazilianNumber(formatted);

         if (!Number.isNaN(decimalValue) && decimalValue >= 0) {
            const finalValue = valueInCents
               ? Math.round(decimalValue * 100)
               : decimalValue;

            if (debounceMs > 0) {
               debouncedOnChange(finalValue);
            } else {
               onChange?.(finalValue);
            }
         }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
         const allowedKeys = [
            "Backspace",
            "Delete",
            "Tab",
            "Escape",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "Home",
            "End",
         ];

         const isNumber = /^[0-9]$/.test(e.key);
         const isComma = e.key === ",";
         const currentValue = (e.target as HTMLInputElement).value;
         const alreadyHasComma = currentValue.includes(",");

         if (
            !isNumber &&
            !(isComma && !alreadyHasComma) &&
            !allowedKeys.includes(e.key) &&
            !e.ctrlKey &&
            !e.metaKey
         ) {
            e.preventDefault();
         }
      };

      return (
         <InputGroup className={className}>
            <InputGroupAddon>
               <InputGroupText>R$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
               data-slot="input-group-control"
               inputMode="decimal"
               onChange={handleChange}
               onKeyDown={handleKeyDown}
               placeholder={placeholder}
               ref={(node) => {
                  inputRef.current = node;
                  if (typeof ref === "function") {
                     ref(node);
                  } else if (ref) {
                     ref.current = node;
                  }
               }}
               type="text"
               value={displayValue}
               {...props}
            />
            <InputGroupAddon align="inline-end">
               <InputGroupText>BRL</InputGroupText>
            </InputGroupAddon>
         </InputGroup>
      );
   },
);

MoneyInput.displayName = "MoneyInput";
