import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@packages/ui/components/item";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building2, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/integrations/clients";

interface AccountStepProps {
	initialBankAccountId?: string;
	onSelect: (accountId: string) => void;
}

export function AccountStep({
	initialBankAccountId,
	onSelect,
}: AccountStepProps) {
	const trpc = useTRPC();
	const { data: bankAccounts } = useSuspenseQuery(
		trpc.bankAccounts.getAll.queryOptions(),
	);
	const hasAutoSelectedRef = useRef(false);

	const activeAccounts = bankAccounts.filter(
		(account) => account.status === "active",
	);

	// Auto-select if bankAccountId is provided and exists
	useEffect(() => {
		if (hasAutoSelectedRef.current) return;

		if (initialBankAccountId) {
			const account = activeAccounts.find(
				(a) => a.id === initialBankAccountId,
			);
			if (account) {
				hasAutoSelectedRef.current = true;
				onSelect(initialBankAccountId);
			}
		}
	}, [initialBankAccountId, activeAccounts, onSelect]);

	if (activeAccounts.length === 0) {
		return (
			<div className="text-center py-8">
				<Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
				<p className="text-muted-foreground">
					Nenhuma conta bancária encontrada.
				</p>
				<p className="text-sm text-muted-foreground mt-1">
					Crie uma conta bancária primeiro para exportar transações.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{activeAccounts.map((account) => (
				<button
					className="w-full text-left"
					key={account.id}
					onClick={() => onSelect(account.id)}
					type="button"
				>
					<Item
						className="cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
						variant="outline"
					>
						<ItemMedia variant="icon">
							<Building2 className="size-6" />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>{account.name || "Conta sem nome"}</ItemTitle>
							<ItemDescription>
								{account.bank}
								{account.type ? ` • ${account.type}` : ""}
							</ItemDescription>
						</ItemContent>
						<ChevronRightIcon className="size-5 text-muted-foreground" />
					</Item>
				</button>
			))}
		</div>
	);
}
