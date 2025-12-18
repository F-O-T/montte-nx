import { translate } from "@packages/localization";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";

export const TRANSACTION_TYPE_CONFIG = {
	expense: {
		color: "#ef4444",
		icon: ArrowUpRight,
		label: translate(
			"dashboard.routes.transactions.list-section.types.expense",
		),
	},
	income: {
		color: "#10b981",
		icon: ArrowDownLeft,
		label: translate(
			"dashboard.routes.transactions.list-section.types.income",
		),
	},
	transfer: {
		color: "#3b82f6",
		icon: ArrowLeftRight,
		label: translate(
			"dashboard.routes.transactions.list-section.types.transfer",
		),
	},
} as const;

export type TransactionType = keyof typeof TRANSACTION_TYPE_CONFIG;
