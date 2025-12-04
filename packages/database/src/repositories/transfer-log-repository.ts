import { AppError, propagateError } from "@packages/utils/errors";
import { eq, or } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { transferLog } from "../schemas/transfers";

export type TransferLog = typeof transferLog.$inferSelect;
export type NewTransferLog = typeof transferLog.$inferInsert;

export async function createTransferLog(
   dbClient: DatabaseInstance,
   data: NewTransferLog,
) {
   try {
      const result = await dbClient
         .insert(transferLog)
         .values(data)
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to create transfer log");
      }

      const createdId = result[0].id;

      const createdLog = await dbClient.query.transferLog.findFirst({
         where: (log, { eq }) => eq(log.id, createdId),
         with: {
            fromBankAccount: true,
            fromTransaction: true,
            organization: true,
            toBankAccount: true,
            toTransaction: true,
         },
      });

      if (!createdLog) {
         throw AppError.database("Failed to fetch created transfer log");
      }

      return createdLog;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create transfer log: ${(err as Error).message}`,
      );
   }
}

export async function findTransferLogById(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient.query.transferLog.findFirst({
         where: (log, { eq }) => eq(log.id, id),
         with: {
            fromBankAccount: true,
            fromTransaction: true,
            organization: true,
            toBankAccount: true,
            toTransaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transfer log by id: ${(err as Error).message}`,
      );
   }
}

export async function findTransferLogByTransactionId(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient.query.transferLog.findFirst({
         where: (log, { eq, or }) =>
            or(
               eq(log.fromTransactionId, transactionId),
               eq(log.toTransactionId, transactionId),
            ),
         with: {
            fromBankAccount: true,
            fromTransaction: true,
            organization: true,
            toBankAccount: true,
            toTransaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transfer log by transaction id: ${(err as Error).message}`,
      );
   }
}

export async function findTransferLogsByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.transferLog.findMany({
         orderBy: (log, { desc }) => desc(log.createdAt),
         where: (log, { eq }) => eq(log.organizationId, organizationId),
         with: {
            fromBankAccount: true,
            fromTransaction: true,
            organization: true,
            toBankAccount: true,
            toTransaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transfer logs by organization id: ${(err as Error).message}`,
      );
   }
}

export async function updateTransferLog(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<NewTransferLog>,
) {
   try {
      const result = await dbClient
         .update(transferLog)
         .set(data)
         .where(eq(transferLog.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Transfer log not found");
      }

      const updatedLog = await dbClient.query.transferLog.findFirst({
         where: (log, { eq }) => eq(log.id, id),
         with: {
            fromBankAccount: true,
            fromTransaction: true,
            organization: true,
            toBankAccount: true,
            toTransaction: true,
         },
      });

      if (!updatedLog) {
         throw AppError.database("Failed to fetch updated transfer log");
      }

      return updatedLog;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update transfer log: ${(err as Error).message}`,
      );
   }
}

export async function deleteTransferLog(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient
         .delete(transferLog)
         .where(eq(transferLog.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Transfer log not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete transfer log: ${(err as Error).message}`,
      );
   }
}

export async function deleteTransferLogByTransactionId(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient
         .delete(transferLog)
         .where(
            or(
               eq(transferLog.fromTransactionId, transactionId),
               eq(transferLog.toTransactionId, transactionId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete transfer log by transaction id: ${(err as Error).message}`,
      );
   }
}
