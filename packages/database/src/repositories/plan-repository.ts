import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { plan } from "../schema";

export type PlanRow = typeof plan.$inferSelect;

export async function listActivePlans(
   db: DatabaseInstance,
): Promise<PlanRow[]> {
   return await db.query.plan.findMany({
      orderBy: (table, { asc }) => [
         asc(table.sortOrder),
         asc(table.displayName),
      ],
      where: (table, { eq }) => eq(table.isActive, true),
   });
}

export async function upsertInitialPlans(db: DatabaseInstance): Promise<void> {
   const now = new Date();

   const rows: Array<typeof plan.$inferInsert> = [
      {
         description: "Para pequenos negócios e uso pessoal",
         displayName: "Basic",
         features: [
            "Até 3 membros",
            "1.000 transações/mês",
            "Relatórios básicos",
            "Suporte por email",
            "Exportação OFX",
         ],
         highlighted: false,
         isActive: true,
         name: "basic",
         priceAnnualLabel: "R$ 290",
         priceMonthlyLabel: "R$ 29",
         sortOrder: 1,
         stripeAnnualPriceId: "price_1SboqvE5CATrB1A7v6iCfAga",
         stripeMonthlyPriceId: "price_1Sboj6E5CATrB1A7VMmTCMR7",
         updatedAt: now,
      },
      {
         description: "Para equipes em crescimento",
         displayName: "Pro",
         features: [
            "Até 10 membros",
            "10.000 transações/mês",
            "Relatórios avançados",
            "Suporte prioritário",
            "API access",
            "14 dias de teste grátis",
         ],
         freeTrialDays: 14,
         highlighted: true,
         isActive: true,
         name: "pro",
         priceAnnualLabel: "R$ 790",
         priceMonthlyLabel: "R$ 79",
         sortOrder: 2,
         stripeAnnualPriceId: "price_1Sbos7E5CATrB1A7Wyy9NaIW",
         stripeMonthlyPriceId: "price_1SbojVE5CATrB1A7hhwYpjbj",
         updatedAt: now,
      },
   ];

   for (const row of rows) {
      await db.insert(plan).values(row).onConflictDoUpdate({
         set: row,
         target: plan.name,
      });
   }
}

export async function getPlanByName(
   db: DatabaseInstance,
   name: string,
): Promise<PlanRow | undefined> {
   const rows = await db
      .select()
      .from(plan)
      .where(eq(plan.name, name))
      .limit(1);
   return rows[0];
}

export type BetterAuthPlan = {
   name: string;
   priceId: string;
   annualDiscountPriceId?: string;
   freeTrial?: { days: number };
};

export async function listPlansForBetterAuth(
   db: DatabaseInstance,
): Promise<BetterAuthPlan[]> {
   const plans = await listActivePlans(db);

   return plans.map((p) => ({
      annualDiscountPriceId: p.stripeAnnualPriceId,
      ...(p.freeTrialDays ? { freeTrial: { days: p.freeTrialDays } } : {}),
      name: p.name,
      priceId: p.stripeMonthlyPriceId,
   }));
}
