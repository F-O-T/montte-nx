import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { formatCurrency } from "../lib/split-calculator";

interface ExpenseSplitSettlementFormProps {
	participantId: string;
	participantName: string;
	remainingAmount: number;
}

export function ExpenseSplitSettlementForm({
	participantId,
	participantName,
	remainingAmount,
}: ExpenseSplitSettlementFormProps) {
	const trpc = useTRPC();
	const { closeSheet } = useSheet();

	const settlementMutation = useMutation(
		trpc.expenseSplits.recordSettlement.mutationOptions({
			onSuccess: () => {
				closeSheet();
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			amount: remainingAmount.toFixed(2),
			notes: "",
		},
		onSubmit: async ({ value }) => {
			const amount = Number.parseFloat(value.amount);
			if (Number.isNaN(amount) || amount <= 0) {
				return;
			}

			await settlementMutation.mutateAsync({
				amount: amount.toFixed(2),
				notes: value.notes || undefined,
				participantId,
			});
		},
	});

	return (
		<form
			className="h-full flex flex-col"
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<SheetHeader>
				<SheetTitle>Record Settlement</SheetTitle>
				<SheetDescription>
					Record a payment from {participantName}. Remaining balance:{" "}
					{formatCurrency(remainingAmount)}
				</SheetDescription>
			</SheetHeader>

			<div className="grid gap-4 px-4 flex-1">
				<FieldGroup>
					<form.Field name="amount">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel>Amount</FieldLabel>
									<Input
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="0.00"
										type="number"
										step="0.01"
										min="0"
										max={remainingAmount}
										value={field.state.value}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>

				<FieldGroup>
					<form.Field name="notes">
						{(field) => (
							<Field>
								<FieldLabel>Notes (Optional)</FieldLabel>
								<Textarea
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Add any notes about this payment..."
									value={field.state.value}
								/>
							</Field>
						)}
					</form.Field>
				</FieldGroup>

				<div className="mt-4 p-3 bg-muted rounded-md">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Remaining after payment:</span>
						<span className="font-medium">
							{formatCurrency(
								Math.max(
									0,
									remainingAmount -
										(Number.parseFloat(form.state.values.amount) || 0),
								),
							)}
						</span>
					</div>
				</div>
			</div>

			<SheetFooter>
				<form.Subscribe>
					{(state) => (
						<Button
							className="w-full"
							disabled={
								!state.canSubmit ||
								state.isSubmitting ||
								settlementMutation.isPending
							}
							type="submit"
						>
							Record Payment
						</Button>
					)}
				</form.Subscribe>
			</SheetFooter>
		</form>
	);
}
