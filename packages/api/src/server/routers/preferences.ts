import {
   findPreferenceByUserId,
   upsertPreference,
} from "@packages/database/repositories/preference-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const updatePreferenceSchema = z.object({
   currency: z.string().optional(),
});

export const preferenceRouter = router({
   get: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      if (!resolvedCtx.session?.user) {
         throw new Error("Unauthorized");
      }

      const userId = resolvedCtx.session.user.id;

      const preference = await findPreferenceByUserId(resolvedCtx.db, userId);

      // Return default preference if none exists
      return (
         preference || {
            createdAt: new Date(),
            currency: "USD",
            id: "",
            updatedAt: new Date(),
            userId,
         }
      );
   }),

   update: protectedProcedure
      .input(updatePreferenceSchema)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         const userId = resolvedCtx.session.user.id;

         return upsertPreference(resolvedCtx.db, userId, input);
      }),
});
