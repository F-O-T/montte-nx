import { z } from "zod";
import { protectedProcedure, router, publicProcedure } from "../trpc";

export const sessionRouter = router({
   getSession: publicProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      return resolvedCtx.session;
   }),
   listAllSessions: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const sessionsResponse = await resolvedCtx.auth.api.listSessions({
         headers: resolvedCtx.headers,
      });
      return sessionsResponse;
   }),
   logout: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      await resolvedCtx.auth.api.signOut({
         headers: resolvedCtx.headers,
      });
   }),
   revokeOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      await resolvedCtx.auth.api.revokeOtherSessions({
         headers: resolvedCtx.headers,
      });
   }),

   revokeSessionByToken: protectedProcedure
      .input(
         z.object({
            token: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { token } = input;
         await resolvedCtx.auth.api.revokeSession({
            body: { token },
            headers: resolvedCtx.headers,
         });
      }),
   revokeSessions: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      await resolvedCtx.auth.api.revokeSessions({
         headers: resolvedCtx.headers,
      });
   }),
});
