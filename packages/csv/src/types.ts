export interface CsvColumnMapping {
   date: number;
   amount: number;
   description: number;
   type?: number;
}

export interface BankFormat {
   id: string;
   name: string;
   delimiter: string;
   dateFormat: string;
   amountFormat: "decimal-comma" | "decimal-dot";
   hasHeader: boolean;
   columnMapping: CsvColumnMapping;
   detectPattern: (headers: string[]) => boolean;
}

export interface ParsedCsvRow {
   rowIndex: number;
   date: Date;
   amount: number;
   description: string;
   type: "income" | "expense";
   raw: string[];
}

export interface CsvParseError {
   row: number;
   column?: number;
   message: string;
}

export interface CsvParseResult {
   headers: string[];
   rows: ParsedCsvRow[];
   detectedFormat: BankFormat | null;
   errors: CsvParseError[];
   totalRows: number;
}

export interface CsvParseOptions {
   delimiter?: string;
   columnMapping?: CsvColumnMapping;
   dateFormat?: string;
   amountFormat?: "decimal-comma" | "decimal-dot";
   skipRows?: number;
   selectedRows?: number[];
}
