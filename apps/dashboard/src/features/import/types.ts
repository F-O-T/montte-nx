export type FileType = "csv" | "ofx";

export type ImportStep =
	| "select-account"
	| "upload"
	| "column-mapping"
	| "preview"
	| "importing";

export type ColumnMapping = {
	date: number;
	amount: number;
	description: number;
	type?: number;
};

export type CsvPreviewData = {
	headers: string[];
	sampleRows: string[][];
	detectedFormat: { id: string; name: string } | null;
	suggestedMapping: {
		date: number | null;
		amount: number | null;
		description: number | null;
	};
	totalRows: number;
	delimiter: string;
};

export type ParsedTransaction = {
	rowIndex: number;
	date: Date;
	amount: number;
	description: string;
	type: "income" | "expense";
	externalId?: string; // FITID for OFX
};

export type SerializedTransaction = Omit<ParsedTransaction, "date"> & {
	date: string; // ISO string
};

export type DuplicateInfo = {
	rowIndex: number;
	existingTransactionId: string;
	existingTransactionDate: string;
	existingTransactionDescription: string;
};

// Helper to serialize transactions for session storage
export function serializeTransactions(
	transactions: ParsedTransaction[],
): SerializedTransaction[] {
	return transactions.map((t) => ({
		...t,
		date: t.date.toISOString(),
	}));
}

// Helper to deserialize transactions from session storage
export function deserializeTransactions(
	transactions: SerializedTransaction[],
): ParsedTransaction[] {
	return transactions.map((t) => ({
		...t,
		date: new Date(t.date),
	}));
}

// Get steps based on file type
export function getStepsForFileType(fileType: FileType | null): ImportStep[] {
	// Before file type is known (account + upload steps)
	if (!fileType) {
		return ["select-account", "upload"];
	}
	// After file is uploaded
	if (fileType === "csv") {
		return [
			"select-account",
			"upload",
			"column-mapping",
			"preview",
			"importing",
		];
	}
	// OFX skips column mapping
	return ["select-account", "upload", "preview", "importing"];
}

// Detect file type from filename
export function detectFileType(filename: string): FileType | null {
	const ext = filename.split(".").pop()?.toLowerCase();
	if (ext === "csv") return "csv";
	if (ext === "ofx") return "ofx";
	return null;
}
