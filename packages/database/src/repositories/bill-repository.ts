import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bill } from "../schemas/bills";

export type Bill = typeof bill.$inferSelect;
export type NewBill = typeof bill.$inferInsert;

export async function createBill(dbClient: DatabaseInstance, data: NewBill) {
   try {
      const result = await dbClient.insert(bill).values(data).returning();

      const createdBill = await dbClient.query.bill.findFirst({
         where: (bill, { eq }) => eq(bill.id, result[0].id),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });

      if (!createdBill) {
         throw AppError.database("Failed to fetch created bill");
      }

      return createdBill;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create bill: ${(err as Error).message}`,
      );
   }
}

export async function findBillById(dbClient: DatabaseInstance, billId: string) {
   try {
      const result = await dbClient.query.bill.findFirst({
         where: (bill, { eq }) => eq(bill.id, billId),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bill by id: ${(err as Error).message}`,
      );
   }
}

export async function findBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.bill.findMany({
         orderBy: (bill, { desc }) => desc(bill.dueDate),
         where: (bill, { eq }) => eq(bill.userId, userId),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bills by user id: ${(err as Error).message}`,
      );
   }
}

export async function findBillsByUserIdAndType(
   dbClient: DatabaseInstance,
   userId: string,
   type: "income" | "expense",
) {
   try {
      const result = await dbClient.query.bill.findMany({
         orderBy: (bill, { desc }) => desc(bill.dueDate),
         where: (bill, { eq, and }) =>
            and(eq(bill.userId, userId), eq(bill.type, type)),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find bills by user id and type: ${(err as Error).message}`,
      );
   }
}

export async function findPendingBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await dbClient.query.bill.findMany({
         orderBy: (bill, { desc }) => desc(bill.dueDate),
         where: (bill, { eq, and, gte, isNull }) =>
            and(
               eq(bill.userId, userId),
               gte(bill.dueDate, today),
               isNull(bill.completionDate),
            ),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find pending bills: ${(err as Error).message}`,
      );
   }
}

export async function findOverdueBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await dbClient.query.bill.findMany({
         orderBy: (bill, { desc }) => desc(bill.dueDate),
         where: (bill, { eq, and, lt, isNull }) =>
            and(
               eq(bill.userId, userId),
               lt(bill.dueDate, today),
               isNull(bill.completionDate),
            ),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find overdue bills: ${(err as Error).message}`,
      );
   }
}

export async function findCompletedBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.bill.findMany({
         orderBy: (bill, { desc }) => desc(bill.completionDate),
         where: (bill, { eq, and, isNotNull }) =>
            and(eq(bill.userId, userId), isNotNull(bill.completionDate)),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find completed bills: ${(err as Error).message}`,
      );
   }
}

export async function updateBill(
   dbClient: DatabaseInstance,
   billId: string,
   data: Partial<NewBill>,
) {
   try {
      const result = await dbClient
         .update(bill)
         .set(data)
         .where(eq(bill.id, billId))
         .returning();

      if (!result.length) {
         throw AppError.database("Bill not found");
      }

      const updatedBill = await dbClient.query.bill.findFirst({
         where: (bill, { eq }) => eq(bill.id, billId),
         with: {
            bankAccount: true,
            transaction: true,
         },
      });

      if (!updatedBill) {
         throw AppError.database("Failed to fetch updated bill");
      }

      return updatedBill;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update bill: ${(err as Error).message}`,
      );
   }
}

export async function deleteBill(dbClient: DatabaseInstance, billId: string) {
   try {
      const result = await dbClient
         .delete(bill)
         .where(eq(bill.id, billId))
         .returning();

      if (!result.length) {
         throw AppError.database("Bill not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete bill: ${(err as Error).message}`,
      );
   }
}

export async function getTotalBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient
         .select({ count: sql<number>`count(*)` })
         .from(bill)
         .where(eq(bill.userId, userId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total bills count: ${(err as Error).message}`,
      );
   }
}

export async function getTotalPendingPayablesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient
         .select({
            total: sql<number>`sum(CASE WHEN ${bill.type} = 'expense' AND ${bill.completionDate} IS NULL THEN CAST(${bill.amount} AS REAL) ELSE 0 END)`,
         })
         .from(bill)
         .where(eq(bill.userId, userId));

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total pending payables: ${(err as Error).message}`,
      );
   }
}

export async function getTotalPendingReceivablesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient
         .select({
            total: sql<number>`sum(CASE WHEN ${bill.type} = 'income' AND ${bill.completionDate} IS NULL THEN CAST(${bill.amount} AS REAL) ELSE 0 END)`,
         })
         .from(bill)
         .where(eq(bill.userId, userId));

      return result[0]?.total || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total pending receivables: ${(err as Error).message}`,
      );
   }
}

export async function getTotalOverdueBillsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count bills where dueDate < today and not completed
      const result = await dbClient.query.bill.findMany({
         where: (bill, { eq, and, lt, isNull }) =>
            and(
               eq(bill.userId, userId),
               lt(bill.dueDate, today),
               isNull(bill.completionDate),
            ),
      });

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total overdue bills count: ${(err as Error).message}`,
      );
   }
}

export async function getTotalOverduePayablesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count overdue expense bills
      const result = await dbClient.query.bill.findMany({
         where: (bill, { eq, and, lt, isNull }) =>
            and(
               eq(bill.userId, userId),
               eq(bill.type, "expense"),
               lt(bill.dueDate, today),
               isNull(bill.completionDate),
            ),
      });

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total overdue payables count: ${(err as Error).message}`,
      );
   }
}

export async function getTotalOverdueReceivablesByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count overdue income bills
      const result = await dbClient.query.bill.findMany({
         where: (bill, { eq, and, lt, isNull }) =>
            and(
               eq(bill.userId, userId),
               eq(bill.type, "income"),
               lt(bill.dueDate, today),
               isNull(bill.completionDate),
            ),
      });

      return result.length;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total overdue receivables count: ${(err as Error).message}`,
      );
   }
}
