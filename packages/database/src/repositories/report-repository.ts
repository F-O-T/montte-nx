import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bill } from "../schemas/bills";
import { category } from "../schemas/categories";
import { transaction } from "../schemas/transactions";

export interface PeriodFilter {
   startDate: Date;
   endDate: Date;
}

export interface FinancialSummary {
   totalIncome: number;
   totalExpenses: number;
   netBalance: number;
   totalTransactions: number;
}

export interface CategoryBreakdown {
   category: string;
   categoryName: string;
   categoryColor: string;
   income: number;
   expenses: number;
   total: number;
   transactionCount: number;
}

export interface PlannedVsActual {
   planned: {
      income: number;
      expenses: number;
      total: number;
   };
   actual: {
      income: number;
      expenses: number;
      total: number;
   };
   variance: {
      income: number;
      expenses: number;
      total: number;
   };
}

export interface CashFlowData {
   date: string;
   plannedIncome: number;
   plannedExpenses: number;
   actualIncome: number;
   actualExpenses: number;
}

export interface PaymentPerformance {
   totalBills: number;
   paidOnTime: number;
   paidLate: number;
   pending: number;
   overdue: number;
   paymentRate: number;
   onTimeRate: number;
   averageDelayDays: number;
}

export async function getFinancialSummaryByPeriod(
   dbClient: DatabaseInstance,
   userId: string,
   period: PeriodFilter,
) {
   try {
      const result = await dbClient
         .select({
            totalExpenses: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'expense'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            totalIncome: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'income'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            totalTransactions: sql<number>`COUNT(*)`,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, period.startDate),
               lte(transaction.date, period.endDate),
            ),
         );

      const data = result[0];
      const totalIncome = data?.totalIncome || 0;
      const totalExpenses = data?.totalExpenses || 0;

      return {
         netBalance: totalIncome - totalExpenses,
         totalExpenses,
         totalIncome,
         totalTransactions: data?.totalTransactions || 0,
      } as FinancialSummary;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get financial summary: ${(err as Error).message}`,
      );
   }
}

export async function getCategoryBreakdownByPeriod(
   dbClient: DatabaseInstance,
   userId: string,
   period: PeriodFilter,
) {
   try {
      // First, get all transactions for the period
      const transactions = await dbClient
         .select({
            categoryIds: transaction.categoryIds,
            type: transaction.type,
            amount: transaction.amount,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, period.startDate),
               lte(transaction.date, period.endDate),
            ),
         );

      // Get all user categories
      const categories = await dbClient
         .select({
            id: category.id,
            name: category.name,
            color: category.color,
         })
         .from(category)
         .where(eq(category.userId, userId));

      // Create a map of category ID to category info
      const categoryMap = new Map(
         categories.map((cat) => [cat.id, { name: cat.name, color: cat.color }]),
      );

      // Process the transactions to get category breakdown
      const categoryStats = new Map<string, {
         expenses: number;
         income: number;
         transactionCount: number;
         categoryName: string;
         categoryColor: string;
      }>();

      for (const tx of transactions) {
         for (const categoryId of tx.categoryIds) {
            const categoryInfo = categoryMap.get(categoryId);
            const categoryName = categoryInfo?.name || 'Unknown Category';
            const categoryColor = categoryInfo?.color || '#8884d8';

            if (!categoryStats.has(categoryId)) {
               categoryStats.set(categoryId, {
                  expenses: 0,
                  income: 0,
                  transactionCount: 0,
                  categoryName,
                  categoryColor,
               });
            }

            const stats = categoryStats.get(categoryId)!;
            stats.transactionCount++;

            if (tx.type === 'expense') {
               stats.expenses += Number(tx.amount);
            } else if (tx.type === 'income') {
               stats.income += Number(tx.amount);
            }
         }
      }

      // Convert to the expected format
      return Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
         category: categoryId,
         categoryName: stats.categoryName,
         categoryColor: stats.categoryColor,
         expenses: stats.expenses,
         income: stats.income,
         total: stats.income - stats.expenses,
         transactionCount: stats.transactionCount,
      })) as CategoryBreakdown[];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get category breakdown: ${(err as Error).message}`,
      );
   }
}

export async function getPlannedVsActualByPeriod(
   dbClient: DatabaseInstance,
   userId: string,
   period: PeriodFilter,
) {
   try {
      // Get planned amounts from bills (based on dueDate)
      const plannedResult = await dbClient
         .select({
            expenses: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${bill.type} = 'expense'
							THEN CAST(${bill.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            income: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${bill.type} = 'income'
							THEN CAST(${bill.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
         })
         .from(bill)
         .where(
            and(
               eq(bill.userId, userId),
               gte(bill.dueDate, period.startDate),
               lte(bill.dueDate, period.endDate),
            ),
         );

      // Get actual amounts from transactions
      const actualResult = await dbClient
         .select({
            expenses: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'expense'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            income: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'income'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, period.startDate),
               lte(transaction.date, period.endDate),
            ),
         );

      const planned = plannedResult[0];
      const actual = actualResult[0];

      const plannedIncome = planned?.income || 0;
      const plannedExpenses = planned?.expenses || 0;
      const actualIncome = actual?.income || 0;
      const actualExpenses = actual?.expenses || 0;

      return {
         actual: {
            expenses: actualExpenses,
            income: actualIncome,
            total: actualIncome - actualExpenses,
         },
         planned: {
            expenses: plannedExpenses,
            income: plannedIncome,
            total: plannedIncome - plannedExpenses,
         },
         variance: {
            expenses: actualExpenses - plannedExpenses,
            income: actualIncome - plannedIncome,
            total:
               actualIncome -
               actualExpenses -
               (plannedIncome - plannedExpenses),
         },
      } as PlannedVsActual;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get planned vs actual: ${(err as Error).message}`,
      );
   }
}

export async function getCashFlowByPeriod(
   dbClient: DatabaseInstance,
   userId: string,
   period: PeriodFilter,
   groupBy: "day" | "week" | "month" = "day",
) {
   try {
      const dateFormat =
         groupBy === "day"
            ? "YYYY-MM-DD"
            : groupBy === "week"
              ? "YYYY-IW"
              : "YYYY-MM";

      // Get planned cash flow from bills
      const plannedResult = await dbClient
         .select({
            date: sql<string>`TO_CHAR(${bill.dueDate}, ${sql.raw(`'${dateFormat}'`)})`,
            expenses: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${bill.type} = 'expense'
							THEN CAST(${bill.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            income: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${bill.type} = 'income'
							THEN CAST(${bill.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
         })
         .from(bill)
         .where(
            and(
               eq(bill.userId, userId),
               gte(bill.dueDate, period.startDate),
               lte(bill.dueDate, period.endDate),
            ),
         )
         .groupBy(sql`TO_CHAR(${bill.dueDate}, ${sql.raw(`'${dateFormat}'`)})`);

      // Get actual cash flow from transactions
      const actualResult = await dbClient
         .select({
            date: sql<string>`TO_CHAR(${transaction.date}, ${sql.raw(`'${dateFormat}'`)})`,
            expenses: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'expense'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
            income: sql<number>`
					COALESCE(
						SUM(
							CASE WHEN ${transaction.type} = 'income'
							THEN CAST(${transaction.amount} AS REAL)
							ELSE 0
							END
						),
						0
					)
				`,
         })
         .from(transaction)
         .where(
            and(
               eq(transaction.userId, userId),
               gte(transaction.date, period.startDate),
               lte(transaction.date, period.endDate),
            ),
         )
         .groupBy(
            sql`TO_CHAR(${transaction.date}, ${sql.raw(`'${dateFormat}'`)})`,
         );

      // Merge planned and actual data
      const plannedMap = new Map(
         plannedResult.map((r) => [
            r.date,
            { expenses: r.expenses, income: r.income },
         ]),
      );
      const actualMap = new Map(
         actualResult.map((r) => [
            r.date,
            { expenses: r.expenses, income: r.income },
         ]),
      );

      const allDates = new Set([...plannedMap.keys(), ...actualMap.keys()]);

      const cashFlowData: CashFlowData[] = Array.from(allDates)
         .sort()
         .map((date) => {
            const planned = plannedMap.get(date) || { expenses: 0, income: 0 };
            const actual = actualMap.get(date) || { expenses: 0, income: 0 };

            return {
               actualExpenses: actual.expenses || 0,
               actualIncome: actual.income || 0,
               date,
               plannedExpenses: planned.expenses || 0,
               plannedIncome: planned.income || 0,
            };
         });

      return cashFlowData;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get cash flow: ${(err as Error).message}`,
      );
   }
}

export async function getPaymentPerformanceByPeriod(
   dbClient: DatabaseInstance,
   userId: string,
   period: PeriodFilter,
) {
   try {
      // Get all bills in the period
      const billsResult = await dbClient.query.bill.findMany({
         where: (bill, { eq, and, gte, lte }) =>
            and(
               eq(bill.userId, userId),
               gte(bill.dueDate, period.startDate),
               lte(bill.dueDate, period.endDate),
            ),
      });

      const totalBills = billsResult.length;
      let paidOnTime = 0;
      let paidLate = 0;
      let pending = 0;
      let overdue = 0;
      let totalDelayDays = 0;
      let latePaymentsCount = 0;

      const now = new Date();

      for (const b of billsResult) {
         if (b.completionDate) {
            // Bill is paid
            const delayDays = Math.floor(
               (b.completionDate.getTime() - b.dueDate.getTime()) /
                  (1000 * 60 * 60 * 24),
            );

            if (delayDays <= 0) {
               paidOnTime++;
            } else {
               paidLate++;
               totalDelayDays += delayDays;
               latePaymentsCount++;
            }
         } else {
            // Bill is not paid
            if (b.dueDate < now) {
               overdue++;
            } else {
               pending++;
            }
         }
      }

      const paymentRate =
         totalBills > 0 ? ((paidOnTime + paidLate) / totalBills) * 100 : 0;
      const onTimeRate =
         paidOnTime + paidLate > 0
            ? (paidOnTime / (paidOnTime + paidLate)) * 100
            : 0;
      const averageDelayDays =
         latePaymentsCount > 0 ? totalDelayDays / latePaymentsCount : 0;

      return {
         averageDelayDays,
         onTimeRate,
         overdue,
         paidLate,
         paidOnTime,
         paymentRate,
         pending,
         totalBills,
      } as PaymentPerformance;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get payment performance: ${(err as Error).message}`,
      );
   }
}
