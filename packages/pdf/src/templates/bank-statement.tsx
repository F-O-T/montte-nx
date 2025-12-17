import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Footer } from "../components/footer";

export type BankStatementTransaction = {
	date: string;
	description: string | null;
	amount: string;
	type: string;
};

export type BankStatementProps = {
	bankAccount: {
		name: string | null;
		bank: string | null;
		type: string;
	};
	transactions: BankStatementTransaction[];
	period: {
		startDate?: string;
		endDate?: string;
	};
	generatedAt: string;
};

const TRANSACTIONS_PER_PAGE = 30;

const styles = StyleSheet.create({
	badge: {
		alignSelf: "flex-start",
		backgroundColor: "#2563eb",
		borderRadius: 4,
		color: "#ffffff",
		fontSize: 10,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	headerContainer: {
		borderBottom: "1 solid #e5e7eb",
		marginBottom: 20,
		paddingBottom: 15,
	},
	noData: {
		color: "#9ca3af",
		fontSize: 10,
		padding: 20,
		textAlign: "center",
	},
	page: {
		fontFamily: "Helvetica",
		fontSize: 10,
		padding: 40,
		paddingBottom: 60,
	},
	periodText: {
		color: "#6b7280",
		fontSize: 10,
		marginBottom: 10,
	},
	subtitle: {
		color: "#6b7280",
		fontSize: 12,
		marginBottom: 4,
	},
	summaryCard: {
		backgroundColor: "#f9fafb",
		borderColor: "#e5e7eb",
		borderRadius: 4,
		borderWidth: 1,
		padding: 12,
		width: "23%",
	},
	summaryCards: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 20,
	},
	summaryLabel: {
		color: "#6b7280",
		fontSize: 9,
		marginBottom: 4,
	},
	summaryValue: {
		fontSize: 14,
		fontWeight: "bold",
	},
	table: {
		borderColor: "#e5e7eb",
		borderRadius: 4,
		borderWidth: 1,
	},
	tableHeader: {
		backgroundColor: "#f3f4f6",
		borderBottomColor: "#e5e7eb",
		borderBottomWidth: 1,
		flexDirection: "row",
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	tableHeaderCell: {
		color: "#374151",
		fontSize: 8,
		fontWeight: "bold",
		textTransform: "uppercase",
	},
	tableRow: {
		borderBottomColor: "#e5e7eb",
		borderBottomWidth: 1,
		flexDirection: "row",
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	tableRowLast: {
		borderBottomWidth: 0,
		flexDirection: "row",
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	title: {
		color: "#111827",
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 4,
	},
	transactionsTitle: {
		color: "#111827",
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 10,
	},
});

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		currency: "BRL",
		style: "currency",
	}).format(value);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function formatShortDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function getBankAccountTypeLabel(type: string): string {
	switch (type) {
		case "checking":
			return "Conta Corrente";
		case "savings":
			return "Conta Poupança";
		case "investment":
			return "Investimento";
		default:
			return "Conta";
	}
}

function getTransactionTypeLabel(type: string): string {
	switch (type) {
		case "income":
			return "Receita";
		case "expense":
			return "Despesa";
		case "transfer":
			return "Transferência";
		default:
			return type;
	}
}

function TransactionsTableHeader() {
	return (
		<View style={styles.tableHeader}>
			<Text style={[styles.tableHeaderCell, { width: "15%" }]}>Data</Text>
			<Text style={[styles.tableHeaderCell, { width: "45%" }]}>
				Descrição
			</Text>
			<Text style={[styles.tableHeaderCell, { width: "15%" }]}>Tipo</Text>
			<Text
				style={[
					styles.tableHeaderCell,
					{ textAlign: "right", width: "25%" },
				]}
			>
				Valor
			</Text>
		</View>
	);
}

function TransactionRow({
	transaction,
	isLast,
}: {
	transaction: BankStatementTransaction;
	isLast: boolean;
}) {
	const amount = Number.parseFloat(transaction.amount);
	const isExpense = transaction.type === "expense";
	const displayAmount = isExpense ? -amount : amount;

	return (
		<View style={isLast ? styles.tableRowLast : styles.tableRow}>
			<Text style={{ color: "#374151", fontSize: 9, width: "15%" }}>
				{formatShortDate(transaction.date)}
			</Text>
			<Text
				style={{
					color: "#374151",
					fontSize: 9,
					overflow: "hidden",
					width: "45%",
				}}
			>
				{transaction.description || "-"}
			</Text>
			<Text style={{ color: "#6b7280", fontSize: 9, width: "15%" }}>
				{getTransactionTypeLabel(transaction.type)}
			</Text>
			<Text
				style={{
					color: isExpense ? "#dc2626" : "#16a34a",
					fontSize: 9,
					fontWeight: "bold",
					textAlign: "right",
					width: "25%",
				}}
			>
				{formatCurrency(displayAmount)}
			</Text>
		</View>
	);
}

export function BankStatementTemplate({
	bankAccount,
	transactions,
	period,
	generatedAt,
}: BankStatementProps) {
	const totalIncome = transactions
		.filter((t) => t.type === "income")
		.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

	const totalExpenses = transactions
		.filter((t) => t.type === "expense")
		.reduce((sum, t) => sum + Number.parseFloat(t.amount), 0);

	const balance = totalIncome - totalExpenses;

	const summaryCards = [
		{
			color: "#16a34a",
			label: "Receitas",
			value: formatCurrency(totalIncome),
		},
		{
			color: "#dc2626",
			label: "Despesas",
			value: formatCurrency(totalExpenses),
		},
		{
			color: balance >= 0 ? "#16a34a" : "#dc2626",
			label: "Saldo",
			value: formatCurrency(balance),
		},
		{
			color: "#2563eb",
			label: "Transações",
			value: transactions.length.toString(),
		},
	];

	const transactionPages: (typeof transactions)[] = [];
	for (let i = 0; i < transactions.length; i += TRANSACTIONS_PER_PAGE) {
		transactionPages.push(transactions.slice(i, i + TRANSACTIONS_PER_PAGE));
	}

	const periodText =
		period.startDate && period.endDate
			? `${formatDate(period.startDate)} a ${formatDate(period.endDate)}`
			: "Todos os períodos";

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.headerContainer}>
					<Text style={styles.badge}>Extrato Bancário</Text>
					<Text style={styles.title}>
						{bankAccount.name || "Conta Bancária"}
					</Text>
					<Text style={styles.subtitle}>
						{bankAccount.bank || "Banco"} -{" "}
						{getBankAccountTypeLabel(bankAccount.type)}
					</Text>
				</View>

				<Text style={styles.periodText}>Período: {periodText}</Text>

				<View style={styles.summaryCards}>
					{summaryCards.map((card, index) => (
						<View key={index} style={styles.summaryCard}>
							<Text style={styles.summaryLabel}>{card.label}</Text>
							<Text style={[styles.summaryValue, { color: card.color }]}>
								{card.value}
							</Text>
						</View>
					))}
				</View>

				{transactions.length === 0 ? (
					<View>
						<Text style={styles.transactionsTitle}>Transações (0)</Text>
						<Text style={styles.noData}>
							Nenhuma transação encontrada no período selecionado
						</Text>
					</View>
				) : (
					<View>
						<Text style={styles.transactionsTitle}>
							Transações ({transactions.length})
						</Text>
						<View style={styles.table}>
							<TransactionsTableHeader />
							{transactions
								.slice(0, TRANSACTIONS_PER_PAGE)
								.map((transaction, index) => (
									<TransactionRow
										key={index}
										isLast={
											index ===
											Math.min(TRANSACTIONS_PER_PAGE, transactions.length) - 1
										}
										transaction={transaction}
									/>
								))}
						</View>
					</View>
				)}

				<Footer generatedAt={generatedAt} />
			</Page>

			{transactionPages.slice(1).map((pageTransactions, pageIndex) => (
				<Page key={pageIndex + 1} size="A4" style={styles.page}>
					<Text style={styles.transactionsTitle}>
						Transações ({transactions.length}) - Página {pageIndex + 2} de{" "}
						{transactionPages.length}
					</Text>

					<View style={styles.table}>
						<TransactionsTableHeader />
						{pageTransactions.map((transaction, index) => (
							<TransactionRow
								key={`${pageIndex + 1}-${index}`}
								isLast={index === pageTransactions.length - 1}
								transaction={transaction}
							/>
						))}
					</View>

					<Footer generatedAt={generatedAt} />
				</Page>
			))}
		</Document>
	);
}
