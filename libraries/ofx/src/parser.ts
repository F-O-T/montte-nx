import { z } from "zod";
import {
   type OFXDocument,
   type OFXHeader,
   ofxHeaderSchema,
   ofxResponseSchema,
} from "./schemas";
import { toArray } from "./utils";

interface TagStackItem {
   name: string;
   content: Record<string, unknown>;
}

const ENTITY_MAP: Record<string, string> = {
   "&amp;": "&",
   "&apos;": "'",
   "&gt;": ">",
   "&lt;": "<",
   "&quot;": '"',
};

const ENTITY_REGEX = /&(?:amp|lt|gt|quot|apos);/g;

function decodeEntities(text: string): string {
   return text.replace(ENTITY_REGEX, (match) => ENTITY_MAP[match] ?? match);
}

function addToContent(
   content: Record<string, unknown>,
   key: string,
   value: unknown,
): void {
   const existing = content[key];
   if (existing !== undefined) {
      if (Array.isArray(existing)) {
         existing.push(value);
      } else {
         content[key] = [existing, value];
      }
   } else {
      content[key] = value;
   }
}

export function sgmlToObject(sgml: string): Record<string, unknown> {
   const result: Record<string, unknown> = {};
   const tagStack: TagStackItem[] = [{ content: result, name: "root" }];
   const stackMap = new Map<string, number>([["root", 0]]);

   const hasSpecialContent = sgml.includes("<?") || sgml.includes("<!--");
   const cleanSgml = hasSpecialContent
      ? sgml.replace(/<\?.*?\?>|<!--.*?-->/gs, "").trim()
      : sgml.trim();

   const tagRegex = /<(\/?)([\w.]+)>([^<]*)/g;
   let match: RegExpExecArray | null = tagRegex.exec(cleanSgml);

   while (match !== null) {
      const isClosing = match[1];
      const tagName = match[2];
      const textContent = match[3]?.trim() ?? "";

      if (!tagName) {
         match = tagRegex.exec(cleanSgml);
         continue;
      }

      const current = tagStack[tagStack.length - 1];
      if (!current) {
         match = tagRegex.exec(cleanSgml);
         continue;
      }

      if (isClosing) {
         const stackIndex = stackMap.get(tagName);
         if (stackIndex !== undefined && stackIndex > 0) {
            for (let i = tagStack.length - 1; i >= stackIndex; i--) {
               const item = tagStack[i];
               if (item) stackMap.delete(item.name);
            }
            tagStack.length = stackIndex;
         }
      } else if (textContent) {
         const decoded = textContent.includes("&")
            ? decodeEntities(textContent)
            : textContent;
         addToContent(current.content, tagName, decoded);
      } else {
         const newObj: Record<string, unknown> = {};
         addToContent(current.content, tagName, newObj);
         stackMap.set(tagName, tagStack.length);
         tagStack.push({ content: newObj, name: tagName });
      }

      match = tagRegex.exec(cleanSgml);
   }

   return result;
}

function normalizeResponseArray(
   msgs: Record<string, unknown>,
   responseKey: string,
   statementKey: string,
): void {
   const responses = msgs[responseKey];
   if (!responses) return;

   for (const response of toArray(responses)) {
      const stmt = (response as Record<string, unknown>)?.[statementKey] as
         | Record<string, unknown>
         | undefined;
      const tranList = stmt?.BANKTRANLIST as
         | Record<string, unknown>
         | undefined;
      if (tranList?.STMTTRN !== undefined) {
         tranList.STMTTRN = toArray(tranList.STMTTRN);
      }
   }
}

export function normalizeTransactions(
   data: Record<string, unknown>,
): Record<string, unknown> {
   const ofx = data.OFX as Record<string, unknown> | undefined;
   if (!ofx) return data;

   const bankMsgs = ofx.BANKMSGSRSV1 as Record<string, unknown> | undefined;
   if (bankMsgs) {
      normalizeResponseArray(bankMsgs, "STMTTRNRS", "STMTRS");
   }

   const ccMsgs = ofx.CREDITCARDMSGSRSV1 as Record<string, unknown> | undefined;
   if (ccMsgs) {
      normalizeResponseArray(ccMsgs, "CCSTMTTRNRS", "CCSTMTRS");
   }

   return data;
}

export function parseHeader(content: string): {
   header: OFXHeader;
   body: string;
} {
   const lines = content.split(/\r?\n/);
   const header: Record<string, string> = {};
   let bodyStartIndex = 0;

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() ?? "";

      if (line.startsWith("<?xml") || line.startsWith("<OFX>")) {
         bodyStartIndex = i;
         break;
      }

      const match = line.match(/^(\w+):(.*)$/);
      if (match?.[1] && match[2] !== undefined) {
         header[match[1]] = match[2];
      }

      if (line === "" && Object.keys(header).length > 0) {
         bodyStartIndex = i + 1;
         break;
      }
   }

   const body = lines.slice(bodyStartIndex).join("\n");
   return { body, header: ofxHeaderSchema.parse(header) };
}

export type ParseResult<T> =
   | { success: true; data: T }
   | { success: false; error: z.ZodError };

export function parse(content: string): ParseResult<OFXDocument> {
   try {
      if (typeof content !== "string") {
         return {
            error: new z.ZodError([
               {
                  code: "invalid_type",
                  expected: "string",
                  message: `Expected string, received ${typeof content}`,
                  path: [],
               },
            ]),
            success: false,
         };
      }

      if (content.trim() === "") {
         return {
            error: new z.ZodError([
               {
                  code: "custom",
                  message: "Content cannot be empty",
                  path: [],
               },
            ]),
            success: false,
         };
      }

      const { header, body } = parseHeader(content);
      const rawData = sgmlToObject(body);
      const normalizedData = normalizeTransactions(rawData);

      const parseResult = ofxResponseSchema.safeParse(normalizedData.OFX);

      if (!parseResult.success) {
         return { error: parseResult.error, success: false };
      }

      return {
         data: { header, OFX: parseResult.data },
         success: true,
      };
   } catch (err) {
      if (err instanceof z.ZodError) {
         return { error: err, success: false };
      }
      throw err;
   }
}

export function parseOrThrow(content: string): OFXDocument {
   const result = parse(content);
   if (!result.success) {
      throw result.error;
   }
   return result.data;
}
