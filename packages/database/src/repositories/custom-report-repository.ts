import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { bankAccount } from "../schemas/bank-accounts";
import { bill } from "../schemas/bills";
import { category, transactionCategory } from "../schemas/categories";
import { costCenter } from "../schemas/cost-centers";
import {
   type CustomReport,
   customReport,
   type DRELineItem,
   type DRESnapshotData,
   type FilterMetadata,
   type NewCustomReport,
   type ReportFilterConfig,
   type TransactionSnapshot,
} from "../schemas/custom-reports";
import { tag, transactionTag } from "../schemas/tags";
import { transaction } from "../schemas/transactions";

export type { CustomReport, DRESnapshotData, ReportFilterConfig };

export async function createCustomReport(
   dbClient: DatabaseInstance,
   data: NewCustomReport,
) {
   try {
      const result = await dbClient
         .insert(customReport)
         .values(data)
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to create custom report");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create custom report: ${(err as Error).message}`,
      );
   }
}

export async function updateCustomReport(
   dbClient: DatabaseInstance,
   reportId: string,
   data: Partial<Pick<CustomReport, "name" | "description">>,
) {
   try {
      const result = await dbClient
         .update(customReport)
         .set({
            ...data,
            updatedAt: new Date(),
         })
         .where(eq(customReport.id, reportId))
         .returning();

      if (!result[0]) {
         throw AppError.notFound("Custom report not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update custom report: ${(err as Error).message}`,
      );
   }
}

export async function deleteCustomReport(
   dbClient: DatabaseInstance,
   reportId: string,
) {
   try {
      const result = await dbClient
         .delete(customReport)
         .where(eq(customReport.id, reportId))
         .returning();

      if (!result[0]) {
         throw AppError.notFound("Custom report not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete custom report: ${(err as Error).message}`,
      );
   }
}

export async function deleteManyCustomReports(
   dbClient: DatabaseInstance,
   reportIds: string[],
   organizationId: string,
) {
   try {
      const result = await dbClient
         .delete(customReport)
         .where(
            and(
               sql`${customReport.id} IN ${reportIds}`,
               eq(customReport.organizationId, organizationId),
            ),
         )
         .returning();

      return {
         count: result.length,
         deletedIds: result.map((r) => r.id),
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete custom reports: ${(err as Error).message}`,
      );
   }
}

export async function findCustomReportById(
   dbClient: DatabaseInstance,
   reportId: string,
) {
   try {
      const result = await dbClient.query.customReport.findFirst({
         where: (report, { eq }) => eq(report.id, reportId),
         with: {
            createdByUser: {
               columns: {
                  email: true,
                  id: true,
                  name: true,
               },
            },
         },
      });

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find custom report: ${(err as Error).message}`,
      );
   }
}

export async function findCustomReportsByOrganizationIdPaginated(
   dbClient: DatabaseInstance,
   organizationId: string,
   options: {
      page?: number;
      limit?: number;
      search?: string;
      type?: "dre_gerencial" | "dre_fiscal";
   } = {},
) {
   const { page = 1, limit = 10, search, type } = options;
   const offset = (page - 1) * limit;

   try {
      const conditions = [eq(customReport.organizationId, organizationId)];

      if (search) {
         conditions.push(ilike(customReport.name, `%${search}%`));
      }

      if (type) {
         conditions.push(eq(customReport.type, type));
      }

      const whereClause = and(...conditions);

      const [reports, totalCount] = await Promise.all([
         dbClient.query.customReport.findMany({
            limit,
            offset,
            orderBy: (report) => desc(report.createdAt),
            where: () => whereClause,
            with: {
               createdByUser: {
                  columns: {
                     email: true,
                     id: true,
                     name: true,
                  },
               },
            },
         }),
         dbClient
            .select({ count: sql<number>`count(*)` })
            .from(customReport)
            .where(whereClause)
            .then((result) => Number(result[0]?.count || 0)),
      ]);

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
         reports,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find custom reports: ${(err as Error).message}`,
      );
   }
}

async function buildFilterMetadata(
   dbClient: DatabaseInstance,
   filterConfig?: ReportFilterConfig,
): Promise<FilterMetadata | undefined> {
   if (!filterConfig) {
      return undefined;
   }

   const hasBankAccountFilter =
      filterConfig.bankAccountIds && filterConfig.bankAccountIds.length > 0;
   const hasCategoryFilter =
      filterConfig.categoryIds && filterConfig.categoryIds.length > 0;
   const hasCostCenterFilter =
      filterConfig.costCenterIds && filterConfig.costCenterIds.length > 0;
   const hasTagFilter = filterConfig.tagIds && filterConfig.tagIds.length > 0;

   if (
      !hasBankAccountFilter &&
      !hasCategoryFilter &&
      !hasCostCenterFilter &&
      !hasTagFilter
   ) {
      return undefined;
   }

   const metadata: FilterMetadata = {
      bankAccounts: [],
      categories: [],
      costCenters: [],
      tags: [],
   };

   if (hasBankAccountFilter) {
      const bankAccounts = await dbClient
         .select({ id: bankAccount.id, name: bankAccount.name })
         .from(bankAccount)
         .where(inArray(bankAccount.id, filterConfig.bankAccountIds!));
      metadata.bankAccounts = bankAccounts.map((ba) => ({
         id: ba.id,
         name: ba.name || "Sem nome",
      }));
   }

   if (hasCategoryFilter) {
      const categories = await dbClient
         .select({ id: category.id, name: category.name })
         .from(category)
         .where(inArray(category.id, filterConfig.categoryIds!));
      metadata.categories = categories.map((c) => ({
         id: c.id,
         name: c.name,
      }));
   }

   if (hasCostCenterFilter) {
      const costCenters = await dbClient
         .select({ id: costCenter.id, name: costCenter.name })
         .from(costCenter)
         .where(inArray(costCenter.id, filterConfig.costCenterIds!));
      metadata.costCenters = costCenters.map((cc) => ({
         id: cc.id,
         name: cc.name,
      }));
   }

   if (hasTagFilter) {
      const tags = await dbClient
         .select({ id: tag.id, name: tag.name })
         .from(tag)
         .where(inArray(tag.id, filterConfig.tagIds!));
      metadata.tags = tags.map((t) => ({
         id: t.id,
         name: t.name,
      }));
   }

   return metadata;
}

function generateDRELines(
   totalIncome: number,
   totalExpenses: number,
): DRELineItem[] {
   const receitaBruta = totalIncome;
   const deducoes = 0;
   const receitaLiquida = receitaBruta - deducoes;
   const custos = 0;
   const lucroBruto = receitaLiquida - custos;
   const despesasOperacionais = totalExpenses;
   const resultadoOperacional = lucroBruto - despesasOperacionais;
   const outrasReceitasDespesas = 0;
   const resultadoLiquido = resultadoOperacional + outrasReceitasDespesas;

   return [
      {
         code: "1",
         indent: 0,
         isTotal: true,
         label: "RECEITA BRUTA",
         value: receitaBruta,
      },
      {
         code: "1.1",
         indent: 1,
         isTotal: false,
         label: "Receitas de Vendas/Serviços",
         value: totalIncome,
      },
      {
         code: "2",
         indent: 0,
         isTotal: false,
         label: "(-) DEDUÇÕES",
         value: deducoes,
      },
      {
         code: "3",
         indent: 0,
         isTotal: true,
         label: "= RECEITA LÍQUIDA",
         value: receitaLiquida,
      },
      {
         code: "4",
         indent: 0,
         isTotal: false,
         label: "(-) CUSTOS DOS PRODUTOS/SERVIÇOS",
         value: custos,
      },
      {
         code: "5",
         indent: 0,
         isTotal: true,
         label: "= LUCRO BRUTO",
         value: lucroBruto,
      },
      {
         code: "6",
         indent: 0,
         isTotal: false,
         label: "(-) DESPESAS OPERACIONAIS",
         value: despesasOperacionais,
      },
      {
         code: "6.1",
         indent: 1,
         isTotal: false,
         label: "Despesas Administrativas",
         value: totalExpenses * 0.4,
      },
      {
         code: "6.2",
         indent: 1,
         isTotal: false,
         label: "Despesas Comerciais",
         value: totalExpenses * 0.35,
      },
      {
         code: "6.3",
         indent: 1,
         isTotal: false,
         label: "Despesas Financeiras",
         value: totalExpenses * 0.25,
      },
      {
         code: "7",
         indent: 0,
         isTotal: true,
         label: "= RESULTADO OPERACIONAL",
         value: resultadoOperacional,
      },
      {
         code: "8",
         indent: 0,
         isTotal: false,
         label: "(+/-) OUTRAS RECEITAS/DESPESAS",
         value: outrasReceitasDespesas,
      },
      {
         code: "9",
         indent: 0,
         isTotal: true,
         label: "= RESULTADO LÍQUIDO DO EXERCÍCIO",
         value: resultadoLiquido,
      },
   ];
}

async function createEmptySnapshotData(
   filterConfig: ReportFilterConfig | undefined,
   dbClient: DatabaseInstance,
): Promise<DRESnapshotData> {
   const filterMetadata = await buildFilterMetadata(dbClient, filterConfig);
   return {
      categoryBreakdown: [],
      dreLines: generateDRELines(0, 0),
      filterMetadata,
      generatedAt: new Date().toISOString(),
      summary: {
         netResult: 0,
         totalExpenses: 0,
         totalIncome: 0,
         transactionCount: 0,
      },
      transactions: [],
   };
}

export async function generateDREGerencialData(
   dbClient: DatabaseInstance,
   organizationId: string,
   startDate: Date,
   endDate: Date,
   filterConfig?: ReportFilterConfig,
): Promise<DRESnapshotData> {
   try {
      const hasBankAccountFilter =
         filterConfig?.bankAccountIds && filterConfig.bankAccountIds.length > 0;
      const hasCategoryFilter =
         filterConfig?.categoryIds && filterConfig.categoryIds.length > 0;
      const hasCostCenterFilter =
         filterConfig?.costCenterIds && filterConfig.costCenterIds.length > 0;
      const hasTagFilter =
         filterConfig?.tagIds && filterConfig.tagIds.length > 0;

      let transactionIdsFromCategoryFilter: string[] | null = null;
      if (hasCategoryFilter) {
         const categoryTransactions = await dbClient
            .select({ transactionId: transactionCategory.transactionId })
            .from(transactionCategory)
            .where(
               inArray(
                  transactionCategory.categoryId,
                  filterConfig.categoryIds!,
               ),
            );
         transactionIdsFromCategoryFilter = categoryTransactions.map(
            (t) => t.transactionId,
         );
      }

      let transactionIdsFromTagFilter: string[] | null = null;
      if (hasTagFilter) {
         const tagTransactions = await dbClient
            .select({ transactionId: transactionTag.transactionId })
            .from(transactionTag)
            .where(inArray(transactionTag.tagId, filterConfig.tagIds!));
         transactionIdsFromTagFilter = tagTransactions.map(
            (t) => t.transactionId,
         );
      }

      const baseConditions = [
         eq(transaction.organizationId, organizationId),
         gte(transaction.date, startDate),
         lte(transaction.date, endDate),
      ];

      if (hasBankAccountFilter) {
         baseConditions.push(
            inArray(transaction.bankAccountId, filterConfig.bankAccountIds!),
         );
      }

      if (hasCostCenterFilter) {
         baseConditions.push(
            inArray(transaction.costCenterId, filterConfig.costCenterIds!),
         );
      }

      if (transactionIdsFromCategoryFilter !== null) {
         if (transactionIdsFromCategoryFilter.length === 0) {
            return createEmptySnapshotData(filterConfig, dbClient);
         }
         baseConditions.push(
            inArray(transaction.id, transactionIdsFromCategoryFilter),
         );
      }

      if (transactionIdsFromTagFilter !== null) {
         if (transactionIdsFromTagFilter.length === 0) {
            return createEmptySnapshotData(filterConfig, dbClient);
         }
         baseConditions.push(
            inArray(transaction.id, transactionIdsFromTagFilter),
         );
      }

      const whereClause = and(...baseConditions);

      const summaryResult = await dbClient
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
         .where(whereClause);

      const summaryData = summaryResult[0];
      const totalIncome = summaryData?.totalIncome || 0;
      const totalExpenses = summaryData?.totalExpenses || 0;

      const filteredTransactionIds = await dbClient
         .select({ id: transaction.id })
         .from(transaction)
         .where(whereClause);

      const txIds = filteredTransactionIds.map((t) => t.id);

      let transactionsWithCategories: {
         amount: string;
         categoryColor: string;
         categoryId: string;
         categoryName: string;
         type: string;
      }[] = [];

      if (txIds.length > 0) {
         transactionsWithCategories = await dbClient
            .select({
               amount: transaction.amount,
               categoryColor: category.color,
               categoryId: category.id,
               categoryName: category.name,
               type: transaction.type,
            })
            .from(transaction)
            .innerJoin(
               transactionCategory,
               eq(transaction.id, transactionCategory.transactionId),
            )
            .innerJoin(
               category,
               eq(transactionCategory.categoryId, category.id),
            )
            .where(inArray(transaction.id, txIds));
      }

      const categoryStats = new Map<
         string,
         {
            categoryColor: string;
            categoryName: string;
            expenses: number;
            income: number;
         }
      >();

      for (const tx of transactionsWithCategories) {
         const categoryId = tx.categoryId;
         if (!categoryStats.has(categoryId)) {
            categoryStats.set(categoryId, {
               categoryColor: tx.categoryColor || "#8884d8",
               categoryName: tx.categoryName || "Sem categoria",
               expenses: 0,
               income: 0,
            });
         }

         const stats = categoryStats.get(categoryId);
         if (!stats) continue;

         if (tx.type === "expense") {
            stats.expenses += Number(tx.amount);
         } else if (tx.type === "income") {
            stats.income += Number(tx.amount);
         }
      }

      const categoryBreakdown = Array.from(categoryStats.entries()).map(
         ([categoryId, stats]) => ({
            categoryColor: stats.categoryColor,
            categoryId,
            categoryName: stats.categoryName,
            expenses: stats.expenses,
            income: stats.income,
         }),
      );

      const dreLines = generateDRELines(totalIncome, totalExpenses);

      const transactionsResult = await dbClient.query.transaction.findMany({
         orderBy: (tx, { desc: descOp }) => descOp(tx.date),
         where: (tx, { eq: eqOp, and: andOp, gte: gteOp, lte: lteOp }) => {
            if (txIds.length === 0) {
               return sql`false`;
            }
            return andOp(
               eqOp(tx.organizationId, organizationId),
               gteOp(tx.date, startDate),
               lteOp(tx.date, endDate),
               inArray(tx.id, txIds),
            );
         },
         with: {
            bankAccount: true,
            costCenter: true,
            transactionCategories: {
               with: {
                  category: true,
               },
            },
            transactionTags: {
               with: {
                  tag: true,
               },
            },
         },
      });

      const transactions: TransactionSnapshot[] = transactionsResult.map(
         (tx) => ({
            amount: Number(tx.amount),
            bankAccount: tx.bankAccount
               ? {
                    id: tx.bankAccount.id,
                    name: tx.bankAccount.name || "Sem nome",
                 }
               : undefined,
            categories: tx.transactionCategories.map((tc) => ({
               color: tc.category.color,
               icon: tc.category.icon || undefined,
               id: tc.category.id,
               name: tc.category.name,
            })),
            categorySplits: tx.categorySplits
               ? tx.categorySplits.map((split) => {
                    const cat = tx.transactionCategories.find(
                       (tc) => tc.category.id === split.categoryId,
                    );
                    return {
                       categoryColor: cat?.category.color || "#8884d8",
                       categoryId: split.categoryId,
                       categoryName: cat?.category.name || "Sem categoria",
                       value: split.value,
                    };
                 })
               : undefined,
            costCenter: tx.costCenter
               ? {
                    code: tx.costCenter.code || undefined,
                    id: tx.costCenter.id,
                    name: tx.costCenter.name,
                 }
               : undefined,
            date: tx.date.toISOString(),
            description: tx.description,
            id: tx.id,
            tags: tx.transactionTags.map((tt) => ({
               color: tt.tag.color,
               id: tt.tag.id,
               name: tt.tag.name,
            })),
            type: tx.type as "income" | "expense" | "transfer",
         }),
      );

      const filterMetadata = await buildFilterMetadata(dbClient, filterConfig);

      return {
         categoryBreakdown,
         dreLines,
         filterMetadata,
         generatedAt: new Date().toISOString(),
         summary: {
            netResult: totalIncome - totalExpenses,
            totalExpenses,
            totalIncome,
            transactionCount: summaryData?.totalTransactions || 0,
         },
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to generate DRE Gerencial data: ${(err as Error).message}`,
      );
   }
}

export async function generateDREFiscalData(
   dbClient: DatabaseInstance,
   organizationId: string,
   startDate: Date,
   endDate: Date,
   filterConfig?: ReportFilterConfig,
): Promise<DRESnapshotData> {
   try {
      const hasBankAccountFilter =
         filterConfig?.bankAccountIds && filterConfig.bankAccountIds.length > 0;
      const hasCategoryFilter =
         filterConfig?.categoryIds && filterConfig.categoryIds.length > 0;
      const hasCostCenterFilter =
         filterConfig?.costCenterIds && filterConfig.costCenterIds.length > 0;
      const hasTagFilter =
         filterConfig?.tagIds && filterConfig.tagIds.length > 0;

      let transactionIdsFromCategoryFilter: string[] | null = null;
      if (hasCategoryFilter) {
         const categoryTransactions = await dbClient
            .select({ transactionId: transactionCategory.transactionId })
            .from(transactionCategory)
            .where(
               inArray(
                  transactionCategory.categoryId,
                  filterConfig.categoryIds!,
               ),
            );
         transactionIdsFromCategoryFilter = categoryTransactions.map(
            (t) => t.transactionId,
         );
      }

      let transactionIdsFromTagFilter: string[] | null = null;
      if (hasTagFilter) {
         const tagTransactions = await dbClient
            .select({ transactionId: transactionTag.transactionId })
            .from(transactionTag)
            .where(inArray(transactionTag.tagId, filterConfig.tagIds!));
         transactionIdsFromTagFilter = tagTransactions.map(
            (t) => t.transactionId,
         );
      }

      const baseConditions = [
         eq(transaction.organizationId, organizationId),
         gte(transaction.date, startDate),
         lte(transaction.date, endDate),
      ];

      if (hasBankAccountFilter) {
         baseConditions.push(
            inArray(transaction.bankAccountId, filterConfig.bankAccountIds!),
         );
      }

      if (hasCostCenterFilter) {
         baseConditions.push(
            inArray(transaction.costCenterId, filterConfig.costCenterIds!),
         );
      }

      if (transactionIdsFromCategoryFilter !== null) {
         if (transactionIdsFromCategoryFilter.length === 0) {
            return createEmptySnapshotData(filterConfig, dbClient);
         }
         baseConditions.push(
            inArray(transaction.id, transactionIdsFromCategoryFilter),
         );
      }

      if (transactionIdsFromTagFilter !== null) {
         if (transactionIdsFromTagFilter.length === 0) {
            return createEmptySnapshotData(filterConfig, dbClient);
         }
         baseConditions.push(
            inArray(transaction.id, transactionIdsFromTagFilter),
         );
      }

      const whereClause = and(...baseConditions);

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
               eq(bill.userId, organizationId),
               gte(bill.dueDate, startDate),
               lte(bill.dueDate, endDate),
            ),
         );

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
            totalTransactions: sql<number>`COUNT(*)`,
         })
         .from(transaction)
         .where(whereClause);

      const planned = plannedResult[0];
      const actual = actualResult[0];

      const plannedIncome = planned?.income || 0;
      const plannedExpenses = planned?.expenses || 0;
      const actualIncome = actual?.income || 0;
      const actualExpenses = actual?.expenses || 0;

      const filteredTransactionIds = await dbClient
         .select({ id: transaction.id })
         .from(transaction)
         .where(whereClause);

      const txIds = filteredTransactionIds.map((t) => t.id);

      let transactionsWithCategories: {
         amount: string;
         categoryColor: string;
         categoryId: string;
         categoryName: string;
         type: string;
      }[] = [];

      if (txIds.length > 0) {
         transactionsWithCategories = await dbClient
            .select({
               amount: transaction.amount,
               categoryColor: category.color,
               categoryId: category.id,
               categoryName: category.name,
               type: transaction.type,
            })
            .from(transaction)
            .innerJoin(
               transactionCategory,
               eq(transaction.id, transactionCategory.transactionId),
            )
            .innerJoin(
               category,
               eq(transactionCategory.categoryId, category.id),
            )
            .where(inArray(transaction.id, txIds));
      }

      const categoryStats = new Map<
         string,
         {
            categoryColor: string;
            categoryName: string;
            expenses: number;
            income: number;
         }
      >();

      for (const tx of transactionsWithCategories) {
         const categoryId = tx.categoryId;
         if (!categoryStats.has(categoryId)) {
            categoryStats.set(categoryId, {
               categoryColor: tx.categoryColor || "#8884d8",
               categoryName: tx.categoryName || "Sem categoria",
               expenses: 0,
               income: 0,
            });
         }

         const stats = categoryStats.get(categoryId);
         if (!stats) continue;

         if (tx.type === "expense") {
            stats.expenses += Number(tx.amount);
         } else if (tx.type === "income") {
            stats.income += Number(tx.amount);
         }
      }

      const categoryBreakdown = Array.from(categoryStats.entries()).map(
         ([categoryId, stats]) => ({
            categoryColor: stats.categoryColor,
            categoryId,
            categoryName: stats.categoryName,
            expenses: stats.expenses,
            income: stats.income,
         }),
      );

      const dreLines = generateDRELinesFiscal(
         actualIncome,
         actualExpenses,
         plannedIncome,
         plannedExpenses,
      );

      const transactionsResult = await dbClient.query.transaction.findMany({
         orderBy: (tx, { desc: descOp }) => descOp(tx.date),
         where: (tx, { eq: eqOp, and: andOp, gte: gteOp, lte: lteOp }) => {
            if (txIds.length === 0) {
               return sql`false`;
            }
            return andOp(
               eqOp(tx.organizationId, organizationId),
               gteOp(tx.date, startDate),
               lteOp(tx.date, endDate),
               inArray(tx.id, txIds),
            );
         },
         with: {
            bankAccount: true,
            costCenter: true,
            transactionCategories: {
               with: {
                  category: true,
               },
            },
            transactionTags: {
               with: {
                  tag: true,
               },
            },
         },
      });

      const transactions: TransactionSnapshot[] = transactionsResult.map(
         (tx) => ({
            amount: Number(tx.amount),
            bankAccount: tx.bankAccount
               ? {
                    id: tx.bankAccount.id,
                    name: tx.bankAccount.name || "Sem nome",
                 }
               : undefined,
            categories: tx.transactionCategories.map((tc) => ({
               color: tc.category.color,
               icon: tc.category.icon || undefined,
               id: tc.category.id,
               name: tc.category.name,
            })),
            categorySplits: tx.categorySplits
               ? tx.categorySplits.map((split) => {
                    const cat = tx.transactionCategories.find(
                       (tc) => tc.category.id === split.categoryId,
                    );
                    return {
                       categoryColor: cat?.category.color || "#8884d8",
                       categoryId: split.categoryId,
                       categoryName: cat?.category.name || "Sem categoria",
                       value: split.value,
                    };
                 })
               : undefined,
            costCenter: tx.costCenter
               ? {
                    code: tx.costCenter.code || undefined,
                    id: tx.costCenter.id,
                    name: tx.costCenter.name,
                 }
               : undefined,
            date: tx.date.toISOString(),
            description: tx.description,
            id: tx.id,
            tags: tx.transactionTags.map((tt) => ({
               color: tt.tag.color,
               id: tt.tag.id,
               name: tt.tag.name,
            })),
            type: tx.type as "income" | "expense" | "transfer",
         }),
      );

      const filterMetadata = await buildFilterMetadata(dbClient, filterConfig);

      return {
         categoryBreakdown,
         dreLines,
         filterMetadata,
         generatedAt: new Date().toISOString(),
         summary: {
            netResult: actualIncome - actualExpenses,
            totalExpenses: actualExpenses,
            totalIncome: actualIncome,
            transactionCount: actual?.totalTransactions || 0,
         },
         transactions,
      };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to generate DRE Fiscal data: ${(err as Error).message}`,
      );
   }
}

function generateDRELinesFiscal(
   actualIncome: number,
   actualExpenses: number,
   plannedIncome: number,
   plannedExpenses: number,
): DRELineItem[] {
   const actualReceitaBruta = actualIncome;
   const plannedReceitaBruta = plannedIncome;
   const actualDeducoes = 0;
   const plannedDeducoes = 0;
   const actualReceitaLiquida = actualReceitaBruta - actualDeducoes;
   const plannedReceitaLiquida = plannedReceitaBruta - plannedDeducoes;
   const actualCustos = 0;
   const plannedCustos = 0;
   const actualLucroBruto = actualReceitaLiquida - actualCustos;
   const plannedLucroBruto = plannedReceitaLiquida - plannedCustos;
   const actualDespesasOperacionais = actualExpenses;
   const plannedDespesasOperacionais = plannedExpenses;
   const actualResultadoOperacional =
      actualLucroBruto - actualDespesasOperacionais;
   const plannedResultadoOperacional =
      plannedLucroBruto - plannedDespesasOperacionais;
   const actualOutras = 0;
   const plannedOutras = 0;
   const actualResultadoLiquido = actualResultadoOperacional + actualOutras;
   const plannedResultadoLiquido = plannedResultadoOperacional + plannedOutras;

   return [
      {
         code: "1",
         indent: 0,
         isTotal: true,
         label: "RECEITA BRUTA",
         plannedValue: plannedReceitaBruta,
         value: actualReceitaBruta,
         variance: actualReceitaBruta - plannedReceitaBruta,
      },
      {
         code: "1.1",
         indent: 1,
         isTotal: false,
         label: "Receitas de Vendas/Serviços",
         plannedValue: plannedIncome,
         value: actualIncome,
         variance: actualIncome - plannedIncome,
      },
      {
         code: "2",
         indent: 0,
         isTotal: false,
         label: "(-) DEDUÇÕES",
         plannedValue: plannedDeducoes,
         value: actualDeducoes,
         variance: actualDeducoes - plannedDeducoes,
      },
      {
         code: "3",
         indent: 0,
         isTotal: true,
         label: "= RECEITA LÍQUIDA",
         plannedValue: plannedReceitaLiquida,
         value: actualReceitaLiquida,
         variance: actualReceitaLiquida - plannedReceitaLiquida,
      },
      {
         code: "4",
         indent: 0,
         isTotal: false,
         label: "(-) CUSTOS DOS PRODUTOS/SERVIÇOS",
         plannedValue: plannedCustos,
         value: actualCustos,
         variance: actualCustos - plannedCustos,
      },
      {
         code: "5",
         indent: 0,
         isTotal: true,
         label: "= LUCRO BRUTO",
         plannedValue: plannedLucroBruto,
         value: actualLucroBruto,
         variance: actualLucroBruto - plannedLucroBruto,
      },
      {
         code: "6",
         indent: 0,
         isTotal: false,
         label: "(-) DESPESAS OPERACIONAIS",
         plannedValue: plannedDespesasOperacionais,
         value: actualDespesasOperacionais,
         variance: actualDespesasOperacionais - plannedDespesasOperacionais,
      },
      {
         code: "6.1",
         indent: 1,
         isTotal: false,
         label: "Despesas Administrativas",
         plannedValue: plannedExpenses * 0.4,
         value: actualExpenses * 0.4,
         variance: actualExpenses * 0.4 - plannedExpenses * 0.4,
      },
      {
         code: "6.2",
         indent: 1,
         isTotal: false,
         label: "Despesas Comerciais",
         plannedValue: plannedExpenses * 0.35,
         value: actualExpenses * 0.35,
         variance: actualExpenses * 0.35 - plannedExpenses * 0.35,
      },
      {
         code: "6.3",
         indent: 1,
         isTotal: false,
         label: "Despesas Financeiras",
         plannedValue: plannedExpenses * 0.25,
         value: actualExpenses * 0.25,
         variance: actualExpenses * 0.25 - plannedExpenses * 0.25,
      },
      {
         code: "7",
         indent: 0,
         isTotal: true,
         label: "= RESULTADO OPERACIONAL",
         plannedValue: plannedResultadoOperacional,
         value: actualResultadoOperacional,
         variance: actualResultadoOperacional - plannedResultadoOperacional,
      },
      {
         code: "8",
         indent: 0,
         isTotal: false,
         label: "(+/-) OUTRAS RECEITAS/DESPESAS",
         plannedValue: plannedOutras,
         value: actualOutras,
         variance: actualOutras - plannedOutras,
      },
      {
         code: "9",
         indent: 0,
         isTotal: true,
         label: "= RESULTADO LÍQUIDO DO EXERCÍCIO",
         plannedValue: plannedResultadoLiquido,
         value: actualResultadoLiquido,
         variance: actualResultadoLiquido - plannedResultadoLiquido,
      },
   ];
}
