import { parseCsvContent, type CsvColumnMapping } from "@packages/csv";
import { parseOfxBuffer } from "@packages/ofx";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
import { Label } from "@packages/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@packages/ui/components/table";
import { useMutation } from "@tanstack/react-query";
import {
	AlertTriangleIcon,
	ArrowDownIcon,
	ArrowUpIcon,
	CheckCircle2Icon,
	Loader2Icon,
	XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import type {
	ColumnMapping,
	CsvPreviewData,
	DuplicateInfo,
	FileType,
	ParsedTransaction,
} from "../types";

interface PreviewStepProps {
	bankAccountId: string;
	fileType: FileType;
	content: string;
	columnMapping: ColumnMapping | null;
	csvPreviewData: CsvPreviewData | null;
	initialParsedTransactions: ParsedTransaction[];
	initialSelectedRows: Set<number>;
	initialDuplicates: DuplicateInfo[];
	onBack: () => void;
	onComplete: (
		transactions: ParsedTransaction[],
		selectedRows: Set<number>,
		duplicates: DuplicateInfo[],
	) => void;
}

export function PreviewStep({
	bankAccountId,
	fileType,
	content,
	columnMapping,
	csvPreviewData,
	initialParsedTransactions,
	initialSelectedRows,
	initialDuplicates,
	onBack,
	onComplete,
}: PreviewStepProps) {
	const trpc = useTRPC();

	const [isLoading, setIsLoading] = useState(
		initialParsedTransactions.length === 0,
	);
	const [error, setError] = useState<string | null>(null);
	const [parsedTransactions, setParsedTransactions] = useState<
		ParsedTransaction[]
	>(initialParsedTransactions);
	const [selectedRows, setSelectedRows] = useState<Set<number>>(
		initialSelectedRows.size > 0
			? initialSelectedRows
			: new Set(initialParsedTransactions.map((t) => t.rowIndex)),
	);
	const [duplicates, setDuplicates] =
		useState<DuplicateInfo[]>(initialDuplicates);
	const [checkDuplicates, setCheckDuplicates] = useState(true);

	const hasLoadedRef = useRef(false);
	const hasCheckedDuplicatesRef = useRef(initialDuplicates.length > 0);

	// Check duplicates mutation (for CSV)
	const checkDuplicatesMutation = useMutation({
		...trpc.bankAccounts.checkCsvDuplicates.mutationOptions(),
		onSuccess: (data) => {
			setDuplicates(data.duplicates);
		},
		onError: (error) => {
			console.error("Failed to check duplicates:", error);
			toast.error("Erro ao verificar duplicatas");
		},
	});

	// Parse file when we have all required data
	useEffect(() => {
		// Don't run if already loaded or already have transactions
		if (hasLoadedRef.current || parsedTransactions.length > 0) return;

		// For CSV, wait until we have column mapping and preview data
		if (fileType === "csv" && (!columnMapping || !csvPreviewData)) {
			return;
		}

		hasLoadedRef.current = true;

		const parseFile = async () => {
			try {
				let transactions: ParsedTransaction[] = [];

				if (fileType === "csv") {
					// Decode base64 content preserving UTF-8 characters
					const decodedContent = decodeURIComponent(
						atob(content)
							.split("")
							.map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
							.join(""),
					);

					// At this point we know columnMapping and csvPreviewData exist
					const result = parseCsvContent(decodedContent, {
						delimiter: csvPreviewData!.delimiter,
						columnMapping: columnMapping as CsvColumnMapping,
						dateFormat: "DD/MM/YYYY",
						amountFormat: "decimal-comma",
						skipRows: 1,
					});
					transactions = result.rows;

					// If we got no valid transactions but had errors, show them
					if (transactions.length === 0 && result.errors.length > 0) {
						const errorSample = result.errors.slice(0, 3);
						const errorMessages = errorSample
							.map((e) => `Linha ${e.row}: ${e.message}`)
							.join("; ");
						console.error("CSV parse errors:", result.errors);
						setError(
							`Erro ao processar linhas do CSV: ${errorMessages}${result.errors.length > 3 ? ` (e mais ${result.errors.length - 3} erros)` : ""}`,
						);
						setIsLoading(false);
						return;
					}

					if (result.errors.length > 0) {
						console.warn("CSV parse warnings:", result.errors);
					}
				} else if (fileType === "ofx") {
					// Parse OFX - use binary decoding
					const decodedContent = atob(content);
					const bytes = new Uint8Array(
						decodedContent.split("").map((c) => c.charCodeAt(0)),
					);
					const ofxTransactions = await parseOfxBuffer(bytes);
					transactions = ofxTransactions.map((t, index) => ({
						rowIndex: index,
						date: t.date,
						amount: t.amount,
						description: t.description,
						type: t.type,
						externalId: t.fitid,
					}));
				}

				setParsedTransactions(transactions);
				setSelectedRows(new Set(transactions.map((t) => t.rowIndex)));
				setIsLoading(false);
			} catch (err) {
				console.error("Failed to parse file:", err);
				setError(
					err instanceof Error
						? err.message
						: "Erro ao processar arquivo",
				);
				setIsLoading(false);
				toast.error("Erro ao processar arquivo");
			}
		};

		parseFile();
	}, [content, fileType, columnMapping, csvPreviewData, parsedTransactions.length]);

	// Check duplicates after parsing
	useEffect(() => {
		if (
			hasCheckedDuplicatesRef.current ||
			parsedTransactions.length === 0 ||
			!checkDuplicates
		)
			return;
		hasCheckedDuplicatesRef.current = true;

		// For both OFX and CSV, use the same duplicate check endpoint
		// The server will match by date+amount+description
		checkDuplicatesMutation.mutate({
			bankAccountId,
			transactions: parsedTransactions.map((t) => ({
				rowIndex: t.rowIndex,
				date: t.date.toISOString(),
				amount: t.amount,
				description: t.description,
			})),
		});
	}, [bankAccountId, parsedTransactions, checkDuplicates, checkDuplicatesMutation]);

	// Toggle duplicate checking
	const handleDuplicateToggle = useCallback(
		(checked: boolean) => {
			setCheckDuplicates(checked);
			if (checked && duplicates.length === 0 && parsedTransactions.length > 0) {
				hasCheckedDuplicatesRef.current = false;
				// Trigger duplicate check
				checkDuplicatesMutation.mutate({
					bankAccountId,
					transactions: parsedTransactions.map((t) => ({
						rowIndex: t.rowIndex,
						date: t.date.toISOString(),
						amount: t.amount,
						description: t.description,
					})),
				});
			}
		},
		[bankAccountId, parsedTransactions, duplicates.length, checkDuplicatesMutation],
	);

	const duplicatesMap = useMemo(() => {
		return new Map(duplicates.map((d) => [d.rowIndex, d]));
	}, [duplicates]);

	const allSelected = parsedTransactions.length === selectedRows.size;
	const someSelected = selectedRows.size > 0 && !allSelected;

	const handleSelectAll = useCallback(() => {
		if (allSelected) {
			setSelectedRows(new Set());
		} else {
			setSelectedRows(new Set(parsedTransactions.map((t) => t.rowIndex)));
		}
	}, [allSelected, parsedTransactions]);

	const handleRowToggle = useCallback((rowIndex: number) => {
		setSelectedRows((prev) => {
			const newSelected = new Set(prev);
			if (newSelected.has(rowIndex)) {
				newSelected.delete(rowIndex);
			} else {
				newSelected.add(rowIndex);
			}
			return newSelected;
		});
	}, []);

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("pt-BR");
	};

	const formatAmount = (amount: number, type: "income" | "expense") => {
		const formatted = Math.abs(amount).toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		});
		return type === "expense" ? `-${formatted}` : formatted;
	};

	const selectedCount = selectedRows.size;
	const duplicateSelectedCount = [...selectedRows].filter((r) =>
		duplicatesMap.has(r),
	).length;

	const handleImport = () => {
		onComplete(parsedTransactions, selectedRows, duplicates);
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 space-y-4">
				<Loader2Icon className="size-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">
					Processando transações...
				</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 space-y-4">
				<XIcon className="size-8 text-destructive" />
				<p className="text-sm text-destructive">{error}</p>
				<Button onClick={onBack} variant="outline">
					Voltar
				</Button>
			</div>
		);
	}

	if (parsedTransactions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 space-y-4">
				<XIcon className="size-8 text-destructive" />
				<p className="text-sm text-destructive">
					Nenhuma transação válida encontrada no arquivo
				</p>
				<Button onClick={onBack} variant="outline">
					Voltar
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium">
						{selectedCount} de {parsedTransactions.length} transações
						selecionadas
					</p>
					{duplicateSelectedCount > 0 && checkDuplicates && (
						<p className="text-xs text-amber-600">
							{duplicateSelectedCount} possíveis duplicatas selecionadas
						</p>
					)}
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<Checkbox
							checked={checkDuplicates}
							id="check-duplicates"
							onCheckedChange={handleDuplicateToggle}
						/>
						<Label
							className="text-sm cursor-pointer"
							htmlFor="check-duplicates"
						>
							Verificar duplicatas
						</Label>
					</div>
					{checkDuplicatesMutation.isPending && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2Icon className="size-4 animate-spin" />
							Verificando...
						</div>
					)}
				</div>
			</div>

			<div className="border rounded-lg overflow-hidden">
				<div className="max-h-[400px] overflow-y-auto">
					<Table>
						<TableHeader className="sticky top-0 bg-background z-10">
							<TableRow>
								<TableHead className="w-12">
									<Checkbox
										checked={
											allSelected || (someSelected ? "indeterminate" : false)
										}
										onCheckedChange={handleSelectAll}
									/>
								</TableHead>
								<TableHead>Data</TableHead>
								<TableHead>Descrição</TableHead>
								<TableHead className="text-right">Valor</TableHead>
								{checkDuplicates && <TableHead>Status</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{parsedTransactions.map((trn) => {
								const duplicate = duplicatesMap.get(trn.rowIndex);
								const isSelected = selectedRows.has(trn.rowIndex);

								return (
									<TableRow
										className={
											isSelected ? "" : "opacity-50 bg-muted/30"
										}
										key={trn.rowIndex}
									>
										<TableCell>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													handleRowToggle(trn.rowIndex)
												}
											/>
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{formatDate(trn.date)}
										</TableCell>
										<TableCell className="max-w-[200px] truncate">
											{trn.description}
										</TableCell>
										<TableCell className="text-right whitespace-nowrap">
											<span
												className={
													trn.type === "income"
														? "text-green-600"
														: "text-red-600"
												}
											>
												<span className="inline-flex items-center gap-1">
													{trn.type === "income" ? (
														<ArrowUpIcon className="size-3" />
													) : (
														<ArrowDownIcon className="size-3" />
													)}
													{formatAmount(trn.amount, trn.type)}
												</span>
											</span>
										</TableCell>
										{checkDuplicates && (
											<TableCell>
												{duplicate ? (
													<Badge
														className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"
														variant="outline"
													>
														<AlertTriangleIcon className="size-3" />
														Duplicata
													</Badge>
												) : (
													<Badge
														className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"
														variant="outline"
													>
														<CheckCircle2Icon className="size-3" />
														Nova
													</Badge>
												)}
											</TableCell>
										)}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</div>

			<div className="flex items-center justify-between pt-4">
				<Button onClick={onBack} variant="ghost">
					Voltar
				</Button>
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">
						{selectedCount} transação(ões) serão importadas
					</span>
					<Button disabled={selectedCount === 0} onClick={handleImport}>
						Importar selecionadas
					</Button>
				</div>
			</div>
		</div>
	);
}
