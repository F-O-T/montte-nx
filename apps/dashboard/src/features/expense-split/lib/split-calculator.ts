import type { SplitType } from "@packages/database/schemas/expense-splits";

interface Participant {
	memberId: string;
	name?: string;
	shareValue?: number;
	percentageValue?: number;
	customAmount?: number;
}

interface SplitResult {
	memberId: string;
	allocatedAmount: string;
	shareValue?: string;
	percentageValue?: string;
}

export function calculateSplit(
	totalAmount: number,
	participants: Participant[],
	splitType: SplitType,
): SplitResult[] {
	if (participants.length === 0) {
		return [];
	}

	switch (splitType) {
		case "equal":
			return calculateEqualSplit(totalAmount, participants);
		case "percentage":
			return calculatePercentageSplit(totalAmount, participants);
		case "shares":
			return calculateSharesSplit(totalAmount, participants);
		case "amount":
			return calculateAmountSplit(participants);
		default:
			return [];
	}
}

function calculateEqualSplit(
	totalAmount: number,
	participants: Participant[],
): SplitResult[] {
	const participantCount = participants.length;
	const baseAmount = Math.floor((totalAmount * 100) / participantCount) / 100;
	const remainder =
		Math.round((totalAmount - baseAmount * participantCount) * 100) / 100;

	return participants.map((participant, index) => {
		// Add remainder to the first participant
		const amount = index === 0 ? baseAmount + remainder : baseAmount;
		return {
			allocatedAmount: amount.toFixed(2),
			memberId: participant.memberId,
		};
	});
}

function calculatePercentageSplit(
	totalAmount: number,
	participants: Participant[],
): SplitResult[] {
	const totalPercentage = participants.reduce(
		(sum, p) => sum + (p.percentageValue || 0),
		0,
	);

	if (Math.abs(totalPercentage - 100) > 0.01) {
		console.warn(
			`Percentages don't add up to 100% (got ${totalPercentage}%)`,
		);
	}

	let allocatedTotal = 0;
	const results = participants.map((participant, index) => {
		const percentage = participant.percentageValue || 0;
		let amount: number;

		// For the last participant, allocate the remainder to avoid rounding issues
		if (index === participants.length - 1) {
			amount = Math.round((totalAmount - allocatedTotal) * 100) / 100;
		} else {
			amount = Math.round((totalAmount * percentage) / 100 * 100) / 100;
			allocatedTotal += amount;
		}

		return {
			allocatedAmount: amount.toFixed(2),
			memberId: participant.memberId,
			percentageValue: percentage.toFixed(2),
		};
	});

	return results;
}

function calculateSharesSplit(
	totalAmount: number,
	participants: Participant[],
): SplitResult[] {
	const totalShares = participants.reduce(
		(sum, p) => sum + (p.shareValue || 1),
		0,
	);

	if (totalShares === 0) {
		return participants.map((p) => ({
			allocatedAmount: "0.00",
			memberId: p.memberId,
			shareValue: "0",
		}));
	}

	let allocatedTotal = 0;
	const results = participants.map((participant, index) => {
		const shares = participant.shareValue || 1;
		let amount: number;

		// For the last participant, allocate the remainder to avoid rounding issues
		if (index === participants.length - 1) {
			amount = Math.round((totalAmount - allocatedTotal) * 100) / 100;
		} else {
			amount = Math.round(((totalAmount * shares) / totalShares) * 100) / 100;
			allocatedTotal += amount;
		}

		return {
			allocatedAmount: amount.toFixed(2),
			memberId: participant.memberId,
			shareValue: shares.toString(),
		};
	});

	return results;
}

function calculateAmountSplit(participants: Participant[]): SplitResult[] {
	return participants.map((participant) => ({
		allocatedAmount: (participant.customAmount || 0).toFixed(2),
		memberId: participant.memberId,
	}));
}

export function formatCurrency(amount: number | string): string {
	const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount;
	return new Intl.NumberFormat("pt-BR", {
		currency: "BRL",
		style: "currency",
	}).format(numAmount);
}

export function validateSplit(
	totalAmount: number,
	participants: SplitResult[],
): { isValid: boolean; message?: string } {
	const allocatedTotal = participants.reduce(
		(sum, p) => sum + Number.parseFloat(p.allocatedAmount),
		0,
	);

	const difference = Math.abs(totalAmount - allocatedTotal);

	if (difference > 0.01) {
		return {
			isValid: false,
			message: `Allocated amounts (${formatCurrency(allocatedTotal)}) don't match total (${formatCurrency(totalAmount)})`,
		};
	}

	return { isValid: true };
}
