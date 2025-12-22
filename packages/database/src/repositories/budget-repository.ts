import { AppError, propagateError } from "@packages/utils/errors";
import { and, count, eq, gte, ilike, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bill } from "../schemas/bills";
import { type BudgetTarget, budget, budgetPeriod } from "../schemas/budgets";
import { transactionCategory } from "../schemas/categories";
import { transactionTag } from "../schemas/tags";
import { transaction } from "../schemas/transactions";

export type Budget = typeof budget.$inferSelect;
export type NewBudget = typeof budget.$inferInsert;
export type BudgetPeriod = typeof budgetPeriod.$inferSelect;
export type NewBudgetPeriod = typeof budgetPeriod.$inferInsert;

export async function createBudget(
   dbClient: DatabaseInstance,
   data: NewBudget,
) {
   try {
      const result = await dbClient.insert(budget).values(data).returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (error.code === "23505") {
         throw AppError.conflict(
            "Budget already exists for this organization",
            { cause: err },
         );
      }

      propagateError(err);
      throw AppError.database(`Failed to create budget: ${error.message}`, {
         cause: err,
      });
   }
}

export async function findBudgetById(
   dbClient: DatabaseInstance,
   budgetId: string,
) {
   try {
      const result = await dbClient.query.budget.findFirst({
         where: (budget, { eq }) => eq(budget.id, budgetId),
         with: {
            periods: {
               limit: 1,
               orderBy: (period, { desc }) => desc(period.periodStart),
            },
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find budget by id: ${(err as Error).message}`,
      );
   }
}

export async function findBudgetsByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.budget.findMany({
         orderBy: (budget, { asc }) => asc(budget.name),
         where: (budget, { eq }) => eq(budget.organizationId, organizationId),
         with: {
            periods: {
               limit: 1,
               orderBy: (period, { desc }) => desc(period.periodStart),
            },
         },
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find budgets by organization id: ${(err as Error).message}`,
      );
   }
}

export async function findBudgetsByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      orderBy?: "name" | "createdAt" | "updatedAt" | "amount";
      orderDirection?: "asc" | "desc";
      search?: string;
      mode?: "personal" | "business";
      isActive?: boolean;
      periodType?:
         | "daily"
         | "weekly"
         | "monthly"
         | "quarterly"
         | "yearly"
         | "custom";
   } = {},
) {
   const {
      page = 1,
      limit = 10,
      orderBy = "name",
      orderDirection = "asc",
      search,
      mode,
      isActive,
      periodType,
   } = options;

   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(budget.organizationId, organizationId)];

      if (search) {
         conditions.push(ilike(budget.name, `%${search}%`));
      }

      if (mode) {
         conditions.push(eq(budget.mode, mode));
      }

      if (isActive !== undefined) {
         conditions.push(eq(budget.isActive, isActive));
      }

      if (periodType) {
         conditions.push(eq(budget.periodType, periodType));
      }

      const whereCondition = and(...conditions);

      const [budgets, totalCount] = await Promise.all([
         dbClient.query.budget.findMany({
            limit,
            offset,
            orderBy: (b, { asc: a, desc: d }) => {
               const column = b[orderBy as keyof typeof b];
               return orderDirection === "asc" ? a(column) : d(column);
            },
            where: whereCondition,
            with: {
               periods: {
                  limit: 1,
                  orderBy: (period, { desc }) => desc(period.periodStart),
               },
            },
         }),
         dbClient
            .select({ count: count() })
            .from(budget)
            .where(whereCondition)
            .then((result) => result[0]?.count || 0),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
         budgets,
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
         `Failed to find budgets by organization id paginated: ${(err as Error).message}`,
      );
   }
}

export async function updateBudget(
   dbClient: DatabaseInstance,
   budgetId: string,
   data: Partial<NewBudget>,
) {
   try {
      const existingBudget = await findBudgetById(dbClient, budgetId);
      if (!existingBudget) {
         throw AppError.notFound("Budget not found");
      }

      const result = await dbClient
         .update(budget)
         .set(data)
         .where(eq(budget.id, budgetId))
         .returning();

      if (!result.length) {
         throw AppError.database("Budget not found");
      }

      return result[0];
   } catch (err: unknown) {
      const error = err as Error & { code?: string };

      if (err instanceof AppError) {
         throw err;
      }

      propagateError(err);
      throw AppError.database(`Failed to update budget: ${error.message}`, {
         cause: err,
      });
   }
}

export async function deleteBudget(
   dbClient: DatabaseInstance,
   budgetId: string,
) {
   try {
      const result = await dbClient
         .delete(budget)
         .where(eq(budget.id, budgetId))
         .returning();

      if (!result.length) {
         throw AppError.database("Budget not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete budget: ${(err as Error).message}`,
      );
   }
}

export async function getTotalBudgetsByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(budget)
         .where(eq(budget.organizationId, organizationId));

      return result[0]?.count || 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total budgets: ${(err as Error).message}`,
      );
   }
}

export async function createBudgetPeriod(
   dbClient: DatabaseInstance,
   data: NewBudgetPeriod,
) {
   try {
      const result = await dbClient
         .insert(budgetPeriod)
         .values(data)
         .returning();
      return result[0];
   } catch (err: unknown) {
      const error = err as Error;
      propagateError(err);
      throw AppError.database(
         `Failed to create budget period: ${error.message}`,
         {
            cause: err,
         },
      );
   }
}

export async function findCurrentBudgetPeriod(
   dbClient: DatabaseInstance,
   budgetId: string,
) {
   try {
      const now = new Date();
      const result = await dbClient.query.budgetPeriod.findFirst({
         where: and(
            eq(budgetPeriod.budgetId, budgetId),
            lte(budgetPeriod.periodStart, now),
            gte(budgetPeriod.periodEnd, now),
         ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find current budget period: ${(err as Error).message}`,
      );
   }
}

export async function findBudgetPeriods(
   dbClient: DatabaseInstance,
   budgetId: string,
   options: {
      limit?: number;
      includeScheduled?: boolean;
   } = {},
) {
   const { limit = 12 } = options;

   try {
      const result = await dbClient.query.budgetPeriod.findMany({
         limit,
         orderBy: (period, { desc }) => desc(period.periodStart),
         where: eq(budgetPeriod.budgetId, budgetId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find budget periods: ${(err as Error).message}`,
      );
   }
}

export async function updateBudgetPeriod(
   dbClient: DatabaseInstance,
   periodId: string,
   data: Partial<NewBudgetPeriod>,
) {
   try {
      const result = await dbClient
         .update(budgetPeriod)
         .set(data)
         .where(eq(budgetPeriod.id, periodId))
         .returning();

      if (!result.length) {
         throw AppError.database("Budget period not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update budget period: ${(err as Error).message}`,
      );
   }
}

export async function closeBudgetPeriod(
   dbClient: DatabaseInstance,
   periodId: string,
) {
   try {
      const result = await dbClient
         .update(budgetPeriod)
         .set({
            closedAt: new Date(),
            isClosed: true,
         })
         .where(eq(budgetPeriod.id, periodId))
         .returning();

      if (!result.length) {
         throw AppError.database("Budget period not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to close budget period: ${(err as Error).message}`,
      );
   }
}

export interface BudgetSpentCalculation {
   spent: number;
   scheduled: number;
   available: number;
   percentage: number;
   forecastPercentage: number;
}

export async function calculateBudgetSpent(
   dbClient: DatabaseInstance,
   budgetData: Budget,
   periodStart: Date,
   periodEnd: Date,
): Promise<BudgetSpentCalculation> {
   try {
      const target = budgetData.target as BudgetTarget;
      let spentAmount = 0;
      let scheduledAmount = 0;

      if (target.type === "category") {
         const spentResult = await dbClient.execute<{ total: string }>(sql`
            SELECT COALESCE(SUM(ABS(CAST(t.amount AS DECIMAL))), 0) as total
            FROM ${transaction} t
            INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
            WHERE tc.category_id = ${target.categoryId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
         `);
         spentAmount = parseFloat(spentResult.rows[0]?.total || "0");

         const scheduledResult = await dbClient.execute<{ total: string }>(sql`
            SELECT COALESCE(SUM(ABS(CAST(b.amount AS DECIMAL))), 0) as total
            FROM ${bill} b
            WHERE b.category_id = ${target.categoryId}
               AND b.type = 'payable'
               AND b.due_date >= ${new Date()}
               AND b.due_date <= ${periodEnd}
               AND b.completion_date IS NULL
               AND b.organization_id = ${budgetData.organizationId}
         `);
         scheduledAmount = parseFloat(scheduledResult.rows[0]?.total || "0");
      } else if (target.type === "categories") {
         const categoryIds = target.categoryIds;
         if (categoryIds.length > 0) {
            const spentResult = await dbClient.execute<{ total: string }>(sql`
               SELECT COALESCE(SUM(ABS(CAST(t.amount AS DECIMAL))), 0) as total
               FROM ${transaction} t
               INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
               WHERE tc.category_id = ANY(ARRAY[${sql.join(
                  categoryIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
               )}])
                  AND t.type = 'expense'
                  AND t.date >= ${periodStart}
                  AND t.date <= ${periodEnd}
                  AND t.organization_id = ${budgetData.organizationId}
            `);
            spentAmount = parseFloat(spentResult.rows[0]?.total || "0");
         }
      } else if (target.type === "tag") {
         const spentResult = await dbClient.execute<{ total: string }>(sql`
            SELECT COALESCE(SUM(ABS(CAST(t.amount AS DECIMAL))), 0) as total
            FROM ${transaction} t
            INNER JOIN ${transactionTag} tt ON t.id = tt.transaction_id
            WHERE tt.tag_id = ${target.tagId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
         `);
         spentAmount = parseFloat(spentResult.rows[0]?.total || "0");
      } else if (target.type === "cost_center") {
         const spentResult = await dbClient.execute<{ total: string }>(sql`
            SELECT COALESCE(SUM(ABS(CAST(t.amount AS DECIMAL))), 0) as total
            FROM ${transaction} t
            WHERE t.cost_center_id = ${target.costCenterId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
         `);
         spentAmount = parseFloat(spentResult.rows[0]?.total || "0");
      }

      const totalBudget = parseFloat(budgetData.amount);
      const available = Math.max(
         0,
         totalBudget - spentAmount - scheduledAmount,
      );
      const percentage =
         totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0;
      const forecastPercentage =
         totalBudget > 0
            ? ((spentAmount + scheduledAmount) / totalBudget) * 100
            : 0;

      return {
         available,
         forecastPercentage: Math.min(100, forecastPercentage),
         percentage: Math.min(100, percentage),
         scheduled: scheduledAmount,
         spent: spentAmount,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to calculate budget spent: ${(err as Error).message}`,
      );
   }
}

export interface BudgetWithProgress extends Budget {
   currentPeriod?: BudgetPeriod | null;
   progress: BudgetSpentCalculation;
}

export async function getBudgetWithProgress(
   dbClient: DatabaseInstance,
   budgetId: string,
): Promise<BudgetWithProgress | null> {
   try {
      const budgetData = await findBudgetById(dbClient, budgetId);
      if (!budgetData) return null;

      const { periodStart, periodEnd } = calculatePeriodDates(budgetData);
      const progress = await calculateBudgetSpent(
         dbClient,
         budgetData,
         periodStart,
         periodEnd,
      );

      let currentPeriod = await findCurrentBudgetPeriod(dbClient, budgetId);

      if (!currentPeriod) {
         currentPeriod = await createBudgetPeriod(dbClient, {
            baseAmount: budgetData.amount,
            budgetId,
            periodEnd,
            periodStart,
            rolloverAmount: "0",
            scheduledAmount: String(progress.scheduled),
            spentAmount: String(progress.spent),
            totalAmount: budgetData.amount,
         });
      } else {
         await updateBudgetPeriod(dbClient, currentPeriod.id, {
            scheduledAmount: String(progress.scheduled),
            spentAmount: String(progress.spent),
         });
      }

      const { periods: _periods, ...budgetWithoutPeriods } = budgetData;

      return {
         ...budgetWithoutPeriods,
         currentPeriod,
         progress,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get budget with progress: ${(err as Error).message}`,
      );
   }
}

export async function getBudgetsWithProgress(
   dbClient: DatabaseInstance,
   organizationId: string,
): Promise<BudgetWithProgress[]> {
   try {
      const budgets = await findBudgetsByOrganizationId(
         dbClient,
         organizationId,
      );

      const budgetsWithProgress = await Promise.all(
         budgets.map(async (b) => {
            const { periodStart, periodEnd } = calculatePeriodDates(b);
            const progress = await calculateBudgetSpent(
               dbClient,
               b,
               periodStart,
               periodEnd,
            );

            const { periods: _periods, ...budgetWithoutPeriods } = b;

            return {
               ...budgetWithoutPeriods,
               currentPeriod: _periods?.[0] ?? null,
               progress,
            };
         }),
      );

      return budgetsWithProgress;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get budgets with progress: ${(err as Error).message}`,
      );
   }
}

function calculatePeriodDates(budgetData: Budget): {
   periodStart: Date;
   periodEnd: Date;
} {
   const now = new Date();
   let periodStart: Date;
   let periodEnd: Date;

   switch (budgetData.periodType) {
      case "daily":
         periodStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
         );
         periodEnd = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999,
         );
         break;
      case "weekly": {
         const dayOfWeek = now.getDay();
         periodStart = new Date(now);
         periodStart.setDate(now.getDate() - dayOfWeek);
         periodStart.setHours(0, 0, 0, 0);
         periodEnd = new Date(periodStart);
         periodEnd.setDate(periodStart.getDate() + 6);
         periodEnd.setHours(23, 59, 59, 999);
         break;
      }
      case "monthly": {
         const startDay = Number(budgetData.periodStartDay) || 1;
         if (now.getDate() >= startDay) {
            periodStart = new Date(now.getFullYear(), now.getMonth(), startDay);
            periodEnd = new Date(
               now.getFullYear(),
               now.getMonth() + 1,
               startDay - 1,
               23,
               59,
               59,
               999,
            );
         } else {
            periodStart = new Date(
               now.getFullYear(),
               now.getMonth() - 1,
               startDay,
            );
            periodEnd = new Date(
               now.getFullYear(),
               now.getMonth(),
               startDay - 1,
               23,
               59,
               59,
               999,
            );
         }
         break;
      }
      case "quarterly": {
         const quarter = Math.floor(now.getMonth() / 3);
         periodStart = new Date(now.getFullYear(), quarter * 3, 1);
         periodEnd = new Date(
            now.getFullYear(),
            (quarter + 1) * 3,
            0,
            23,
            59,
            59,
            999,
         );
         break;
      }
      case "yearly":
         periodStart = new Date(now.getFullYear(), 0, 1);
         periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
         break;
      case "custom":
         periodStart = budgetData.customPeriodStart || now;
         periodEnd = budgetData.customPeriodEnd || now;
         break;
      default:
         periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
         periodEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
         );
   }

   return { periodEnd, periodStart };
}

export interface BudgetStats {
   totalBudgets: number;
   activeBudgets: number;
   totalBudgeted: number;
   totalSpent: number;
   totalScheduled: number;
   totalAvailable: number;
   averageUtilization: number;
   budgetsOverLimit: number;
   budgetsNearLimit: number;
}

export async function getBudgetStats(
   dbClient: DatabaseInstance,
   organizationId: string,
): Promise<BudgetStats> {
   try {
      const budgetsWithProgress = await getBudgetsWithProgress(
         dbClient,
         organizationId,
      );

      const activeBudgets = budgetsWithProgress.filter((b) => b.isActive);
      const totalBudgeted = activeBudgets.reduce(
         (sum, b) => sum + parseFloat(b.amount),
         0,
      );
      const totalSpent = activeBudgets.reduce(
         (sum, b) => sum + b.progress.spent,
         0,
      );
      const totalScheduled = activeBudgets.reduce(
         (sum, b) => sum + b.progress.scheduled,
         0,
      );
      const totalAvailable = activeBudgets.reduce(
         (sum, b) => sum + b.progress.available,
         0,
      );

      const budgetsOverLimit = activeBudgets.filter(
         (b) => b.progress.percentage >= 100,
      ).length;
      const budgetsNearLimit = activeBudgets.filter(
         (b) => b.progress.percentage >= 80 && b.progress.percentage < 100,
      ).length;

      const averageUtilization =
         activeBudgets.length > 0
            ? activeBudgets.reduce((sum, b) => sum + b.progress.percentage, 0) /
              activeBudgets.length
            : 0;

      return {
         activeBudgets: activeBudgets.length,
         averageUtilization,
         budgetsNearLimit,
         budgetsOverLimit,
         totalAvailable,
         totalBudgeted,
         totalBudgets: budgetsWithProgress.length,
         totalScheduled,
         totalSpent,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get budget stats: ${(err as Error).message}`,
      );
   }
}

export async function processRollover(
   dbClient: DatabaseInstance,
   budgetId: string,
): Promise<BudgetPeriod | null> {
   try {
      const budgetData = await findBudgetById(dbClient, budgetId);
      if (!budgetData || !budgetData.rollover) return null;

      const periods = await findBudgetPeriods(dbClient, budgetId, { limit: 2 });
      if (periods.length < 2) return null;

      const lastPeriod = periods[1];
      if (!lastPeriod || lastPeriod.isClosed) return null;

      const spent = parseFloat(lastPeriod.spentAmount || "0");
      const total = parseFloat(lastPeriod.totalAmount);
      let rolloverAmount = Math.max(0, total - spent);

      if (budgetData.rolloverCap) {
         const cap = parseFloat(budgetData.rolloverCap);
         rolloverAmount = Math.min(rolloverAmount, cap);
      }

      await closeBudgetPeriod(dbClient, lastPeriod.id);

      const { periodStart, periodEnd } = calculatePeriodDates(budgetData);
      const baseAmount = parseFloat(budgetData.amount);
      const totalAmount = baseAmount + rolloverAmount;

      const newPeriod = await createBudgetPeriod(dbClient, {
         baseAmount: String(baseAmount),
         budgetId,
         periodEnd,
         periodStart,
         rolloverAmount: String(rolloverAmount),
         totalAmount: String(totalAmount),
      });

      return newPeriod ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to process rollover: ${(err as Error).message}`,
      );
   }
}

export interface BudgetTransaction {
   id: string;
   description: string;
   amount: string;
   date: Date;
   type: string;
   bankAccountId: string | null;
   categoryId?: string;
   categoryName?: string;
}

export async function findTransactionsByBudgetTarget(
   dbClient: DatabaseInstance,
   budgetData: Budget,
   options: {
      periodStart: Date;
      periodEnd: Date;
      page?: number;
      limit?: number;
      search?: string;
   },
): Promise<{
   transactions: BudgetTransaction[];
   pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      limit: number;
   };
}> {
   const { periodStart, periodEnd, page = 1, limit = 10, search } = options;
   const offset = (page - 1) * limit;

   try {
      const target = budgetData.target as BudgetTarget;
      let transactions: BudgetTransaction[] = [];
      let totalCount = 0;

      if (target.type === "category") {
         const searchCondition = search
            ? sql`AND t.description ILIKE ${`%${search}%`}`
            : sql``;

         const countResult = await dbClient.execute<{ count: string }>(sql`
            SELECT COUNT(*) as count
            FROM ${transaction} t
            INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
            WHERE tc.category_id = ${target.categoryId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
         `);
         totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

         const result = await dbClient.execute<{
            id: string;
            description: string;
            amount: string;
            date: Date;
            type: string;
            bank_account_id: string | null;
            category_id: string;
         }>(sql`
            SELECT t.id, t.description, t.amount, t.date, t.type, t.bank_account_id, tc.category_id
            FROM ${transaction} t
            INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
            WHERE tc.category_id = ${target.categoryId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
            ORDER BY t.date DESC
            LIMIT ${limit} OFFSET ${offset}
         `);

         transactions = result.rows.map((row) => ({
            amount: row.amount,
            bankAccountId: row.bank_account_id,
            categoryId: row.category_id,
            date: row.date,
            description: row.description,
            id: row.id,
            type: row.type,
         }));
      } else if (target.type === "categories") {
         const categoryIds = target.categoryIds;
         if (categoryIds.length > 0) {
            const searchCondition = search
               ? sql`AND t.description ILIKE ${`%${search}%`}`
               : sql``;

            const countResult = await dbClient.execute<{ count: string }>(sql`
               SELECT COUNT(*) as count
               FROM ${transaction} t
               INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
               WHERE tc.category_id = ANY(ARRAY[${sql.join(
                  categoryIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
               )}])
                  AND t.type = 'expense'
                  AND t.date >= ${periodStart}
                  AND t.date <= ${periodEnd}
                  AND t.organization_id = ${budgetData.organizationId}
                  ${searchCondition}
            `);
            totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

            const result = await dbClient.execute<{
               id: string;
               description: string;
               amount: string;
               date: Date;
               type: string;
               bank_account_id: string | null;
               category_id: string;
            }>(sql`
               SELECT t.id, t.description, t.amount, t.date, t.type, t.bank_account_id, tc.category_id
               FROM ${transaction} t
               INNER JOIN ${transactionCategory} tc ON t.id = tc.transaction_id
               WHERE tc.category_id = ANY(ARRAY[${sql.join(
                  categoryIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
               )}])
                  AND t.type = 'expense'
                  AND t.date >= ${periodStart}
                  AND t.date <= ${periodEnd}
                  AND t.organization_id = ${budgetData.organizationId}
                  ${searchCondition}
               ORDER BY t.date DESC
               LIMIT ${limit} OFFSET ${offset}
            `);

            transactions = result.rows.map((row) => ({
               amount: row.amount,
               bankAccountId: row.bank_account_id,
               categoryId: row.category_id,
               date: row.date,
               description: row.description,
               id: row.id,
               type: row.type,
            }));
         }
      } else if (target.type === "tag") {
         const searchCondition = search
            ? sql`AND t.description ILIKE ${`%${search}%`}`
            : sql``;

         const countResult = await dbClient.execute<{ count: string }>(sql`
            SELECT COUNT(*) as count
            FROM ${transaction} t
            INNER JOIN ${transactionTag} tt ON t.id = tt.transaction_id
            WHERE tt.tag_id = ${target.tagId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
         `);
         totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

         const result = await dbClient.execute<{
            id: string;
            description: string;
            amount: string;
            date: Date;
            type: string;
            bank_account_id: string | null;
         }>(sql`
            SELECT t.id, t.description, t.amount, t.date, t.type, t.bank_account_id
            FROM ${transaction} t
            INNER JOIN ${transactionTag} tt ON t.id = tt.transaction_id
            WHERE tt.tag_id = ${target.tagId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
            ORDER BY t.date DESC
            LIMIT ${limit} OFFSET ${offset}
         `);

         transactions = result.rows.map((row) => ({
            amount: row.amount,
            bankAccountId: row.bank_account_id,
            date: row.date,
            description: row.description,
            id: row.id,
            type: row.type,
         }));
      } else if (target.type === "cost_center") {
         const searchCondition = search
            ? sql`AND t.description ILIKE ${`%${search}%`}`
            : sql``;

         const countResult = await dbClient.execute<{ count: string }>(sql`
            SELECT COUNT(*) as count
            FROM ${transaction} t
            WHERE t.cost_center_id = ${target.costCenterId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
         `);
         totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

         const result = await dbClient.execute<{
            id: string;
            description: string;
            amount: string;
            date: Date;
            type: string;
            bank_account_id: string | null;
         }>(sql`
            SELECT t.id, t.description, t.amount, t.date, t.type, t.bank_account_id
            FROM ${transaction} t
            WHERE t.cost_center_id = ${target.costCenterId}
               AND t.type = 'expense'
               AND t.date >= ${periodStart}
               AND t.date <= ${periodEnd}
               AND t.organization_id = ${budgetData.organizationId}
               ${searchCondition}
            ORDER BY t.date DESC
            LIMIT ${limit} OFFSET ${offset}
         `);

         transactions = result.rows.map((row) => ({
            amount: row.amount,
            bankAccountId: row.bank_account_id,
            date: row.date,
            description: row.description,
            id: row.id,
            type: row.type,
         }));
      }

      const totalPages = Math.ceil(totalCount / limit);

      return {
         pagination: {
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            limit,
            totalCount,
            totalPages,
         },
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find transactions by budget target: ${(err as Error).message}`,
      );
   }
}

export async function updateBudgets(
   dbClient: DatabaseInstance,
   budgetIds: string[],
   data: Partial<NewBudget>,
   organizationId: string,
) {
   try {
      if (budgetIds.length === 0) return [];

      const result = await dbClient
         .update(budget)
         .set({ ...data, updatedAt: new Date() })
         .where(
            and(
               sql`${budget.id} = ANY(ARRAY[${sql.join(
                  budgetIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
               )}])`,
               eq(budget.organizationId, organizationId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update budgets: ${(err as Error).message}`,
      );
   }
}

export async function deleteBudgets(
   dbClient: DatabaseInstance,
   budgetIds: string[],
   organizationId: string,
) {
   try {
      if (budgetIds.length === 0) return [];

      const result = await dbClient
         .delete(budget)
         .where(
            and(
               sql`${budget.id} = ANY(ARRAY[${sql.join(
                  budgetIds.map((id) => sql`${id}::uuid`),
                  sql`, `,
               )}])`,
               eq(budget.organizationId, organizationId),
            ),
         )
         .returning();

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete budgets: ${(err as Error).message}`,
      );
   }
}

export async function duplicateBudget(
   dbClient: DatabaseInstance,
   budgetId: string,
   organizationId: string,
   newName?: string,
): Promise<Budget> {
   try {
      const existingBudget = await findBudgetById(dbClient, budgetId);

      if (!existingBudget || existingBudget.organizationId !== organizationId) {
         throw AppError.notFound("Budget not found");
      }

      const {
         id: _id,
         createdAt: _createdAt,
         updatedAt: _updatedAt,
         periods: _periods,
         ...budgetData
      } = existingBudget;

      const duplicatedBudget = await createBudget(dbClient, {
         ...budgetData,
         id: crypto.randomUUID(),
         name: newName || `${existingBudget.name} (cópia)`,
         organizationId,
      });

      if (!duplicatedBudget) {
         throw AppError.database("Failed to create duplicated budget");
      }

      return duplicatedBudget;
   } catch (err) {
      if (err instanceof AppError) throw err;
      propagateError(err);
      throw AppError.database(
         `Failed to duplicate budget: ${(err as Error).message}`,
      );
   }
}

export interface BudgetImpactWarning {
   budgetId: string;
   budgetName: string;
   budgetColor: string | null;
   currentSpent: number;
   currentPercentage: number;
   projectedSpent: number;
   projectedPercentage: number;
   budgetAmount: number;
   severity: "info" | "warning" | "danger";
   message: string;
}

export async function checkBudgetImpact(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      amount: number;
      categoryId?: string;
      categoryIds?: string[];
      tagIds?: string[];
      costCenterId?: string;
      excludeTransactionId?: string;
   },
): Promise<BudgetImpactWarning[]> {
   try {
      const budgetsWithProgress = await getBudgetsWithProgress(
         dbClient,
         organizationId,
      );

      const warnings: BudgetImpactWarning[] = [];

      for (const b of budgetsWithProgress) {
         if (!b.isActive) continue;

         const target = b.target as BudgetTarget;
         let isAffected = false;

         if (target.type === "category" && options.categoryId) {
            isAffected = target.categoryId === options.categoryId;
         } else if (target.type === "category" && options.categoryIds) {
            isAffected = options.categoryIds.includes(target.categoryId);
         } else if (target.type === "categories" && options.categoryId) {
            isAffected = target.categoryIds.includes(options.categoryId);
         } else if (target.type === "categories" && options.categoryIds) {
            isAffected = target.categoryIds.some((id) =>
               options.categoryIds?.includes(id),
            );
         } else if (target.type === "tag" && options.tagIds) {
            isAffected = options.tagIds.includes(target.tagId);
         } else if (target.type === "cost_center" && options.costCenterId) {
            isAffected = target.costCenterId === options.costCenterId;
         }

         if (!isAffected) continue;

         const budgetAmount = parseFloat(b.amount);
         const currentSpent = b.progress.spent;
         const currentPercentage = b.progress.percentage;
         const projectedSpent = currentSpent + options.amount;
         const projectedPercentage =
            budgetAmount > 0 ? (projectedSpent / budgetAmount) * 100 : 0;

         let severity: "info" | "warning" | "danger" = "info";
         let message = "";

         if (projectedPercentage >= 100) {
            severity = "danger";
            message = `Este orçamento será excedido (${projectedPercentage.toFixed(0)}%)`;
         } else if (projectedPercentage >= 80) {
            severity = "warning";
            message = `Este orçamento ficará próximo do limite (${projectedPercentage.toFixed(0)}%)`;
         } else if (projectedPercentage >= 50) {
            severity = "info";
            message = `Este orçamento atingirá ${projectedPercentage.toFixed(0)}% do limite`;
         }

         if (severity !== "info" || projectedPercentage >= 50) {
            warnings.push({
               budgetAmount,
               budgetColor: b.color,
               budgetId: b.id,
               budgetName: b.name,
               currentPercentage,
               currentSpent,
               message,
               projectedPercentage,
               projectedSpent,
               severity,
            });
         }
      }

      return warnings.sort((a, b) => {
         const severityOrder = { danger: 0, info: 2, warning: 1 };
         return severityOrder[a.severity] - severityOrder[b.severity];
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to check budget impact: ${(err as Error).message}`,
      );
   }
}

export async function findBudgetsByTarget(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      categoryId?: string;
      categoryIds?: string[];
      tagIds?: string[];
      costCenterId?: string;
   },
): Promise<BudgetWithProgress[]> {
   try {
      const budgetsWithProgress = await getBudgetsWithProgress(
         dbClient,
         organizationId,
      );

      return budgetsWithProgress.filter((b) => {
         if (!b.isActive) return false;

         const target = b.target as BudgetTarget;

         if (target.type === "category" && options.categoryId) {
            return target.categoryId === options.categoryId;
         }
         if (target.type === "category" && options.categoryIds) {
            return options.categoryIds.includes(target.categoryId);
         }
         if (target.type === "categories" && options.categoryId) {
            return target.categoryIds.includes(options.categoryId);
         }
         if (target.type === "categories" && options.categoryIds) {
            return target.categoryIds.some((id) =>
               options.categoryIds?.includes(id),
            );
         }
         if (target.type === "tag" && options.tagIds) {
            return options.tagIds.includes(target.tagId);
         }
         if (target.type === "cost_center" && options.costCenterId) {
            return target.costCenterId === options.costCenterId;
         }

         return false;
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find budgets by target: ${(err as Error).message}`,
      );
   }
}

export { calculatePeriodDates };
