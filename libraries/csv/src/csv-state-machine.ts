import type { ParserState } from "./types";

/**
 * Callback invoked when a complete row has been parsed.
 */
export type OnRowCompleteCallback = (row: string[]) => void;

/**
 * State machine context maintained during parsing.
 */
export interface StateMachineContext {
   state: ParserState;
   currentField: string;
   currentRow: string[];
   delimiter: string;
}

/**
 * Creates a new state machine context.
 *
 * @param delimiter - The field delimiter to use
 * @returns A fresh state machine context
 */
export function createStateMachineContext(
   delimiter: string,
): StateMachineContext {
   return {
      state: "FIELD_START",
      currentField: "",
      currentRow: [],
      delimiter,
   };
}

/**
 * Processes a single character through the CSV state machine.
 * Handles RFC 4180 edge cases including:
 * - Quoted fields with embedded delimiters
 * - Escaped quotes (doubled quotes)
 * - Newlines within quoted fields (both LF and CRLF)
 * - Mixed line endings
 *
 * @param ctx - The state machine context (will be mutated)
 * @param char - The current character
 * @param nextChar - The next character (for CRLF lookahead)
 * @param onRowComplete - Callback invoked when a row is complete
 * @returns Number of characters to skip after this one (0 or 1 for CRLF)
 */
export function processChar(
   ctx: StateMachineContext,
   char: string,
   nextChar: string | undefined,
   onRowComplete: OnRowCompleteCallback,
): number {
   let skipNext = 0;

   switch (ctx.state) {
      case "FIELD_START":
         if (char === '"') {
            ctx.state = "QUOTED_FIELD";
         } else if (char === ctx.delimiter) {
            ctx.currentRow.push(ctx.currentField);
            ctx.currentField = "";
            // Stay in FIELD_START for next field
         } else if (char === "\r" && nextChar === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            skipNext = 1; // Skip \n
         } else if (char === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
         } else {
            ctx.currentField += char;
            ctx.state = "UNQUOTED_FIELD";
         }
         break;

      case "UNQUOTED_FIELD":
         if (char === ctx.delimiter) {
            ctx.currentRow.push(ctx.currentField);
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         } else if (char === "\r" && nextChar === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
            skipNext = 1; // Skip \n
         } else if (char === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         } else {
            ctx.currentField += char;
         }
         break;

      case "QUOTED_FIELD":
         if (char === '"') {
            ctx.state = "QUOTE_IN_QUOTED";
         } else {
            // Newlines inside quotes are kept as-is (including \r\n)
            ctx.currentField += char;
         }
         break;

      case "QUOTE_IN_QUOTED":
         if (char === '"') {
            // Escaped quote ("" -> ")
            ctx.currentField += '"';
            ctx.state = "QUOTED_FIELD";
         } else if (char === ctx.delimiter) {
            // End of quoted field, followed by delimiter
            ctx.currentRow.push(ctx.currentField);
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         } else if (char === "\r" && nextChar === "\n") {
            // End of quoted field, followed by CRLF
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
            skipNext = 1; // Skip \n
         } else if (char === "\n") {
            // End of quoted field, followed by LF
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         } else {
            // Characters after closing quote but before delimiter (non-strict)
            // Some parsers ignore these, we'll keep them for compatibility
            ctx.state = "FIELD_END";
         }
         break;

      case "FIELD_END":
         if (char === ctx.delimiter) {
            ctx.currentRow.push(ctx.currentField);
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         } else if (char === "\r" && nextChar === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
            skipNext = 1; // Skip \n
         } else if (char === "\n") {
            ctx.currentRow.push(ctx.currentField);
            onRowComplete(ctx.currentRow);
            ctx.currentRow = [];
            ctx.currentField = "";
            ctx.state = "FIELD_START";
         }
         // Ignore other characters after closing quote
         break;
   }

   return skipNext;
}

/**
 * Flushes any remaining data in the state machine context.
 * Should be called after processing all input to handle the final row.
 *
 * @param ctx - The state machine context
 * @param onRowComplete - Callback invoked if there's a final row
 * @throws Error if there's an unclosed quoted field
 */
export function flush(
   ctx: StateMachineContext,
   onRowComplete: OnRowCompleteCallback,
): void {
   // Check for unclosed quoted field - this is a parse error
   if (ctx.state === "QUOTED_FIELD") {
      const partialField =
         ctx.currentField.length > 50
            ? `${ctx.currentField.slice(0, 50)}...`
            : ctx.currentField;
      throw new Error(
         `Unclosed quoted field at end of file. Partial content: "${partialField}"`,
      );
   }

   if (ctx.currentField !== "" || ctx.currentRow.length > 0) {
      ctx.currentRow.push(ctx.currentField);
      onRowComplete(ctx.currentRow);
      ctx.currentRow = [];
      ctx.currentField = "";
   }
}

/**
 * Checks if the state machine has pending data that needs to be flushed.
 *
 * @param ctx - The state machine context
 * @returns True if there's pending data
 */
export function hasPendingData(ctx: StateMachineContext): boolean {
   return ctx.currentField !== "" || ctx.currentRow.length > 0;
}

/**
 * Checks if the state machine is currently inside a quoted field.
 * Useful for streaming parsers to know when to preserve buffer content.
 *
 * @param ctx - The state machine context
 * @returns True if currently parsing a quoted field
 */
export function isInQuotedField(ctx: StateMachineContext): boolean {
   return ctx.state === "QUOTED_FIELD";
}
