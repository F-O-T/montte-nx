import { listActivePlans } from "@packages/database/repositories/plan-repository";
import { publicProcedure, router } from "../trpc";

export const plansRouter = router({
   list: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return await listActivePlans(resolvedCtx.db);
   }),
});
