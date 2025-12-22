import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
	expenseSplit,
	expenseSplitParticipant,
	expenseSplitSettlement,
	type NewExpenseSplit,
	type NewExpenseSplitParticipant,
	type NewExpenseSplitSettlement,
} from "../schemas/expense-splits";

// Create expense split with participants
export async function createExpenseSplit(
	dbClient: DatabaseInstance,
	data: NewExpenseSplit,
	participants: Omit<NewExpenseSplitParticipant, "expenseSplitId">[],
) {
	try {
		const result = await dbClient.transaction(async (tx) => {
			// Create the expense split
			const [split] = await tx.insert(expenseSplit).values(data).returning();

			if (!split) {
				throw AppError.database("Failed to create expense split");
			}

			// Create participants
			if (participants.length > 0) {
				const participantsWithSplitId = participants.map((p) => ({
					...p,
					expenseSplitId: split.id,
				}));

				await tx.insert(expenseSplitParticipant).values(participantsWithSplitId);
			}

			return split;
		});

		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to create expense split: ${(err as Error).message}`,
		);
	}
}

// Find expense split by ID with participants
export async function findExpenseSplitById(
	dbClient: DatabaseInstance,
	splitId: string,
) {
	try {
		const result = await dbClient.query.expenseSplit.findFirst({
			where: eq(expenseSplit.id, splitId),
			with: {
				participants: {
					with: {
						member: {
							with: {
								user: true,
							},
						},
						settlements: true,
					},
				},
				transaction: true,
				bill: true,
				team: true,
				createdByMember: {
					with: {
						user: true,
					},
				},
			},
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to find expense split by id: ${(err as Error).message}`,
		);
	}
}

// Find expense splits by organization ID
export async function findExpenseSplitsByOrganizationId(
	dbClient: DatabaseInstance,
	organizationId: string,
	options: {
		page?: number;
		limit?: number;
	} = {},
) {
	const { page = 1, limit = 20 } = options;
	const offset = (page - 1) * limit;

	try {
		const [splits, totalCount] = await Promise.all([
			dbClient.query.expenseSplit.findMany({
				where: eq(expenseSplit.organizationId, organizationId),
				limit,
				offset,
				orderBy: (expenseSplit, { desc }) => desc(expenseSplit.createdAt),
				with: {
					participants: {
						with: {
							member: {
								with: {
									user: true,
								},
							},
						},
					},
					transaction: true,
					bill: true,
					team: true,
				},
			}),
			dbClient.query.expenseSplit
				.findMany({
					where: eq(expenseSplit.organizationId, organizationId),
				})
				.then((result) => result.length),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		return {
			splits,
			pagination: {
				currentPage: page,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
				limit,
				totalCount,
				totalPages,
			},
		};
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to find expense splits by organization id: ${(err as Error).message}`,
		);
	}
}

// Find expense splits by team ID
export async function findExpenseSplitsByTeamId(
	dbClient: DatabaseInstance,
	teamId: string,
) {
	try {
		const result = await dbClient.query.expenseSplit.findMany({
			where: eq(expenseSplit.teamId, teamId),
			orderBy: (expenseSplit, { desc }) => desc(expenseSplit.createdAt),
			with: {
				participants: {
					with: {
						member: {
							with: {
								user: true,
							},
						},
					},
				},
				transaction: true,
				bill: true,
			},
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to find expense splits by team id: ${(err as Error).message}`,
		);
	}
}

// Find expense splits by member ID (as participant)
export async function findExpenseSplitsByMemberId(
	dbClient: DatabaseInstance,
	memberId: string,
) {
	try {
		const participantRecords = await dbClient.query.expenseSplitParticipant.findMany({
			where: eq(expenseSplitParticipant.memberId, memberId),
			with: {
				expenseSplit: {
					with: {
						participants: {
							with: {
								member: {
									with: {
										user: true,
									},
								},
							},
						},
						transaction: true,
						bill: true,
						team: true,
					},
				},
			},
		});

		return participantRecords.map((p) => p.expenseSplit);
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to find expense splits by member id: ${(err as Error).message}`,
		);
	}
}

// Update expense split participant
export async function updateExpenseSplitParticipant(
	dbClient: DatabaseInstance,
	participantId: string,
	data: Partial<NewExpenseSplitParticipant>,
) {
	try {
		const result = await dbClient
			.update(expenseSplitParticipant)
			.set(data)
			.where(eq(expenseSplitParticipant.id, participantId))
			.returning();

		if (!result.length) {
			throw AppError.notFound("Participant not found");
		}

		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to update expense split participant: ${(err as Error).message}`,
		);
	}
}

// Record a settlement
export async function recordSettlement(
	dbClient: DatabaseInstance,
	participantId: string,
	data: Omit<NewExpenseSplitSettlement, "participantId">,
) {
	try {
		const result = await dbClient.transaction(async (tx) => {
			// Create settlement record
			const [settlement] = await tx
				.insert(expenseSplitSettlement)
				.values({
					...data,
					participantId,
				})
				.returning();

			// Update participant settled amount
			const participant = await tx.query.expenseSplitParticipant.findFirst({
				where: eq(expenseSplitParticipant.id, participantId),
			});

			if (!participant) {
				throw AppError.notFound("Participant not found");
			}

			const newSettledAmount =
				Number(participant.settledAmount) + Number(data.amount);
			const allocatedAmount = Number(participant.allocatedAmount);

			let newStatus: "pending" | "partial" | "settled" = "pending";
			if (newSettledAmount >= allocatedAmount) {
				newStatus = "settled";
			} else if (newSettledAmount > 0) {
				newStatus = "partial";
			}

			await tx
				.update(expenseSplitParticipant)
				.set({
					settledAmount: String(newSettledAmount),
					status: newStatus,
					settledAt: newStatus === "settled" ? new Date() : null,
				})
				.where(eq(expenseSplitParticipant.id, participantId));

			return settlement;
		});

		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to record settlement: ${(err as Error).message}`,
		);
	}
}

// Delete expense split
export async function deleteExpenseSplit(
	dbClient: DatabaseInstance,
	splitId: string,
) {
	try {
		const result = await dbClient
			.delete(expenseSplit)
			.where(eq(expenseSplit.id, splitId))
			.returning();

		if (!result.length) {
			throw AppError.notFound("Expense split not found");
		}

		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to delete expense split: ${(err as Error).message}`,
		);
	}
}

// Get member balance (what they owe vs what others owe them)
export async function getMemberBalance(
	dbClient: DatabaseInstance,
	memberId: string,
	organizationId: string,
) {
	try {
		// Get all splits where this member is a participant
		const participations = await dbClient.query.expenseSplitParticipant.findMany({
			where: eq(expenseSplitParticipant.memberId, memberId),
			with: {
				expenseSplit: true,
			},
		});

		// Get all splits created by this member
		const createdSplits = await dbClient.query.expenseSplit.findMany({
			where: and(
				eq(expenseSplit.createdBy, memberId),
				eq(expenseSplit.organizationId, organizationId),
			),
			with: {
				participants: true,
			},
		});

		// Calculate what this member owes (their allocated amount - settled amount)
		let totalOwed = 0;
		for (const participation of participations) {
			// Skip splits created by this member (they don't owe themselves)
			if (participation.expenseSplit.createdBy === memberId) continue;
			const remaining =
				Number(participation.allocatedAmount) - Number(participation.settledAmount);
			if (remaining > 0) {
				totalOwed += remaining;
			}
		}

		// Calculate what others owe this member
		let totalOwedToMember = 0;
		for (const split of createdSplits) {
			for (const participant of split.participants) {
				// Skip the creator's own participation
				if (participant.memberId === memberId) continue;
				const remaining =
					Number(participant.allocatedAmount) - Number(participant.settledAmount);
				if (remaining > 0) {
					totalOwedToMember += remaining;
				}
			}
		}

		return {
			memberOwes: totalOwed,
			owedToMember: totalOwedToMember,
			netBalance: totalOwedToMember - totalOwed,
		};
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get member balance: ${(err as Error).message}`,
		);
	}
}

// Get expense split stats for organization
export async function getExpenseSplitStats(
	dbClient: DatabaseInstance,
	organizationId: string,
) {
	try {
		const splits = await dbClient.query.expenseSplit.findMany({
			where: eq(expenseSplit.organizationId, organizationId),
			with: {
				participants: true,
			},
		});

		let totalSplitAmount = 0;
		let totalSettled = 0;
		let totalPending = 0;
		let activeSplits = 0;

		for (const split of splits) {
			totalSplitAmount += Number(split.totalAmount);

			let hasUnsettled = false;
			for (const participant of split.participants) {
				totalSettled += Number(participant.settledAmount);
				const remaining =
					Number(participant.allocatedAmount) - Number(participant.settledAmount);
				if (remaining > 0) {
					totalPending += remaining;
					hasUnsettled = true;
				}
			}

			if (hasUnsettled) {
				activeSplits++;
			}
		}

		return {
			totalSplits: splits.length,
			activeSplits,
			totalSplitAmount,
			totalSettled,
			totalPending,
		};
	} catch (err) {
		propagateError(err);
		throw AppError.database(
			`Failed to get expense split stats: ${(err as Error).message}`,
		);
	}
}
