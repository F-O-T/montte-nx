import { AppError, propagateError } from "@packages/utils/errors";
import { eq, inArray } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { billAttachment } from "../schemas/bills";

export type BillAttachment = typeof billAttachment.$inferSelect;
export type NewBillAttachment = typeof billAttachment.$inferInsert;

export async function createBillAttachment(
   dbClient: DatabaseInstance,
   data: NewBillAttachment,
) {
   try {
      const result = await dbClient
         .insert(billAttachment)
         .values(data)
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to create bill attachment");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create bill attachment: ${(err as Error).message}`,
      );
   }
}

export async function createManyBillAttachments(
   dbClient: DatabaseInstance,
   data: NewBillAttachment[],
) {
   if (data.length === 0) {
      return [];
   }

   try {
      const result = await dbClient
         .insert(billAttachment)
         .values(data)
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create bill attachments: ${(err as Error).message}`,
      );
   }
}

export async function findBillAttachmentById(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient.query.billAttachment.findFirst({
         where: (attachment, { eq }) => eq(attachment.id, id),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bill attachment by id: ${(err as Error).message}`,
      );
   }
}

export async function findBillAttachmentsByBillId(
   dbClient: DatabaseInstance,
   billId: string,
) {
   try {
      const result = await dbClient.query.billAttachment.findMany({
         orderBy: (attachment, { desc }) => desc(attachment.createdAt),
         where: (attachment, { eq }) => eq(attachment.billId, billId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bill attachments: ${(err as Error).message}`,
      );
   }
}

export async function findBillAttachmentsByBillIds(
   dbClient: DatabaseInstance,
   billIds: string[],
) {
   if (billIds.length === 0) {
      return [];
   }

   try {
      const result = await dbClient.query.billAttachment.findMany({
         orderBy: (attachment, { desc }) => desc(attachment.createdAt),
         where: inArray(billAttachment.billId, billIds),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bill attachments by bill ids: ${(err as Error).message}`,
      );
   }
}

export async function deleteBillAttachment(
   dbClient: DatabaseInstance,
   id: string,
) {
   try {
      const result = await dbClient
         .delete(billAttachment)
         .where(eq(billAttachment.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Bill attachment not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bill attachment: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllBillAttachments(
   dbClient: DatabaseInstance,
   billId: string,
) {
   try {
      const result = await dbClient
         .delete(billAttachment)
         .where(eq(billAttachment.billId, billId))
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bill attachments: ${(err as Error).message}`,
      );
   }
}

export async function deleteManyBillAttachments(
   dbClient: DatabaseInstance,
   ids: string[],
) {
   if (ids.length === 0) {
      return [];
   }

   try {
      const result = await dbClient
         .delete(billAttachment)
         .where(inArray(billAttachment.id, ids))
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bill attachments: ${(err as Error).message}`,
      );
   }
}

export async function countBillAttachments(
   dbClient: DatabaseInstance,
   billId: string,
) {
   try {
      const result = await dbClient.query.billAttachment.findMany({
         where: (attachment, { eq }) => eq(attachment.billId, billId),
      });
      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to count bill attachments: ${(err as Error).message}`,
      );
   }
}
