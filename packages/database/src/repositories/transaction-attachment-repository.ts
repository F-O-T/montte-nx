import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { transactionAttachment } from "../schemas/transactions";

export type TransactionAttachment = typeof transactionAttachment.$inferSelect;
export type NewTransactionAttachment =
   typeof transactionAttachment.$inferInsert;

export async function createTransactionAttachment(
   dbClient: DatabaseInstance,
   data: NewTransactionAttachment,
) {
   try {
      const result = await dbClient
         .insert(transactionAttachment)
         .values(data)
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to create transaction attachment");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create transaction attachment: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionAttachmentById(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient.query.transactionAttachment.findFirst({
         where: (attachment, { eq }) => eq(attachment.id, id),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transaction attachment by id: ${(err as Error).message}`,
      );
   }
}

export async function findTransactionAttachmentsByTransactionId(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient.query.transactionAttachment.findMany({
         orderBy: (attachment, { desc }) => desc(attachment.createdAt),
         where: (attachment, { eq }) =>
            eq(attachment.transactionId, transactionId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transaction attachments: ${(err as Error).message}`,
      );
   }
}

export async function deleteTransactionAttachment(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient
         .delete(transactionAttachment)
         .where(eq(transactionAttachment.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Transaction attachment not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete transaction attachment: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllTransactionAttachments(
   dbClient: DatabaseInstance,
   transactionId: string,
) {
   try {
      const result = await dbClient
         .delete(transactionAttachment)
         .where(eq(transactionAttachment.transactionId, transactionId))
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete transaction attachments: ${(err as Error).message}`,
      );
   }
}
