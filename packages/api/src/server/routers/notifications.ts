import {
   findNotificationsByUserId,
   findUnreadNotificationsByUserId,
   markNotificationAsRead,
} from "@packages/database/repositories/notification-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const notificationRouter = router({
   list: protectedProcedure
      .input(
         z
            .object({
               onlyUnread: z.boolean().default(true),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }
         const userId = resolvedCtx.session.user.id;

         if (input?.onlyUnread !== false) {
            return findUnreadNotificationsByUserId(resolvedCtx.db, userId);
         }
         return findNotificationsByUserId(resolvedCtx.db, userId);
      }),

   markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         if (!resolvedCtx.session?.user) {
            throw new Error("Unauthorized");
         }

         return markNotificationAsRead(resolvedCtx.db, input.id);
      }),
});
