import type { BankFormat } from "./types";

function normalizeHeader(header: string): string {
   return header
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
}

function headersMatch(headers: string[], patterns: string[]): boolean {
   const normalized = headers.map(normalizeHeader);
   return patterns.every((pattern) =>
      normalized.some((h) => h.includes(pattern)),
   );
}

export const BANK_FORMATS: BankFormat[] = [
   {
      id: "nubank",
      name: "Nubank",
      delimiter: ",",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data", "descricao", "valor"]) ||
         headersMatch(headers, ["date", "description", "amount"]),
   },
   {
      id: "itau",
      name: "Itaú",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data", "lancamento", "valor"]) ||
         headersMatch(headers, ["data lancamento", "valor"]),
   },
   {
      id: "bradesco",
      name: "Bradesco",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data mov", "historico", "valor"]) ||
         headersMatch(headers, ["data", "historico", "valor"]),
   },
   {
      id: "inter",
      name: "Banco Inter",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data lancamento", "tipo", "valor"]) ||
         headersMatch(headers, ["data", "descricao", "valor"]),
   },
   {
      id: "santander",
      name: "Santander",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data", "descricao", "valor", "saldo"]),
   },
   {
      id: "banco-do-brasil",
      name: "Banco do Brasil",
      delimiter: ",",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 3 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data", "historico", "documento", "valor"]),
   },
   {
      id: "c6",
      name: "C6 Bank",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: (headers) =>
         headersMatch(headers, ["data", "descricao", "valor"]) &&
         headers.some((h) => normalizeHeader(h).includes("c6")),
   },
   {
      id: "generic-comma",
      name: "CSV Genérico (vírgula)",
      delimiter: ",",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: () => false,
   },
   {
      id: "generic-semicolon",
      name: "CSV Genérico (ponto e vírgula)",
      delimiter: ";",
      dateFormat: "DD/MM/YYYY",
      amountFormat: "decimal-comma",
      hasHeader: true,
      columnMapping: { date: 0, description: 1, amount: 2 },
      detectPattern: () => false,
   },
];

export function detectDelimiter(content: string): string {
   const firstLine = content.split("\n")[0] || "";
   const semicolonCount = (firstLine.match(/;/g) || []).length;
   const commaCount = (firstLine.match(/,/g) || []).length;
   return semicolonCount > commaCount ? ";" : ",";
}

export function detectBankFormat(headers: string[]): BankFormat | null {
   for (const format of BANK_FORMATS) {
      if (format.detectPattern(headers)) {
         return format;
      }
   }
   return null;
}

export function suggestColumnMapping(headers: string[]): {
   date: number | null;
   amount: number | null;
   description: number | null;
} {
   const normalized = headers.map(normalizeHeader);

   let dateCol: number | null = null;
   let amountCol: number | null = null;
   let descriptionCol: number | null = null;

   for (let i = 0; i < normalized.length; i++) {
      const h = normalized[i] ?? "";

      if (
         dateCol === null &&
         (h.includes("data") || h.includes("date") || h === "dt")
      ) {
         dateCol = i;
      }

      if (
         amountCol === null &&
         (h.includes("valor") ||
            h.includes("amount") ||
            h.includes("value") ||
            h === "vl")
      ) {
         amountCol = i;
      }

      if (
         descriptionCol === null &&
         (h.includes("descricao") ||
            h.includes("description") ||
            h.includes("historico") ||
            h.includes("memo") ||
            h.includes("lancamento"))
      ) {
         descriptionCol = i;
      }
   }

   return { date: dateCol, amount: amountCol, description: descriptionCol };
}

export function getAvailableFormats(): Array<{ id: string; name: string }> {
   return BANK_FORMATS.map((f) => ({ id: f.id, name: f.name }));
}

export function getFormatById(id: string): BankFormat | undefined {
   return BANK_FORMATS.find((f) => f.id === id);
}
