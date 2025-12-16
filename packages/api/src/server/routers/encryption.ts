/**
 * Encryption Router
 *
 * API endpoints for managing E2E encryption settings.
 * Application-level encryption is automatic and doesn't need user interaction.
 */

import { user } from "@packages/database/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const encryptionRouter = router({
   /**
    * Get the current user's encryption status
    */
   getStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const userData = await resolvedCtx.db.query.user.findFirst({
         where: (u, { eq }) => eq(u.id, userId),
         columns: {
            encryptionEnabled: true,
            encryptionSalt: true,
         },
      });

      return {
         e2eEnabled: userData?.encryptionEnabled ?? false,
         hasSalt: !!userData?.encryptionSalt,
         // Server-side encryption status
         serverEncryptionEnabled: !!process.env.ENCRYPTION_KEY,
      };
   }),

   /**
    * Get the encryption salt for the current user
    * Used by the client to derive the encryption key
    */
   getSalt: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw new Error("User not found");
      }

      const userData = await resolvedCtx.db.query.user.findFirst({
         where: (u, { eq }) => eq(u.id, userId),
         columns: {
            encryptionSalt: true,
            encryptionEnabled: true,
         },
      });

      if (!userData?.encryptionEnabled) {
         return null;
      }

      return userData.encryptionSalt;
   }),

   /**
    * Enable E2E encryption for the user
    * The client sends the salt and key hash (NOT the key itself)
    */
   enable: protectedProcedure
      .input(
         z.object({
            salt: z.string().min(1),
            keyHash: z.string().min(1),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw new Error("User not found");
         }

         // Check if encryption is already enabled
         const existingUser = await resolvedCtx.db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
               encryptionEnabled: true,
            },
         });

         if (existingUser?.encryptionEnabled) {
            throw new Error("Encryption is already enabled");
         }

         // Enable encryption
         await resolvedCtx.db
            .update(user)
            .set({
               encryptionEnabled: true,
               encryptionSalt: input.salt,
               encryptionKeyHash: input.keyHash,
            })
            .where(eq(user.id, userId));

         return { success: true };
      }),

   /**
    * Verify the encryption key hash
    * Used to check if the user entered the correct passphrase
    */
   verifyKeyHash: protectedProcedure
      .input(
         z.object({
            keyHash: z.string().min(1),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw new Error("User not found");
         }

         const userData = await resolvedCtx.db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
               encryptionKeyHash: true,
               encryptionEnabled: true,
            },
         });

         if (!userData?.encryptionEnabled) {
            throw new Error("Encryption is not enabled");
         }

         const isValid = userData.encryptionKeyHash === input.keyHash;

         return { valid: isValid };
      }),

   /**
    * Disable E2E encryption
    * Note: This should only be done after re-encrypting all data with server-side encryption
    * or after confirming with the user that data will be lost
    */
   disable: protectedProcedure
      .input(
         z.object({
            keyHash: z.string().min(1),
            confirmDataLoss: z.boolean(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw new Error("User not found");
         }

         // Verify the key hash first
         const userData = await resolvedCtx.db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
               encryptionKeyHash: true,
               encryptionEnabled: true,
            },
         });

         if (!userData?.encryptionEnabled) {
            throw new Error("Encryption is not enabled");
         }

         if (userData.encryptionKeyHash !== input.keyHash) {
            throw new Error("Invalid passphrase");
         }

         if (!input.confirmDataLoss) {
            throw new Error("Must confirm data loss");
         }

         // Disable encryption
         await resolvedCtx.db
            .update(user)
            .set({
               encryptionEnabled: false,
               encryptionSalt: null,
               encryptionKeyHash: null,
            })
            .where(eq(user.id, userId));

         return { success: true };
      }),

   /**
    * Update the encryption passphrase
    * Requires the old key hash and new key hash + salt
    */
   updatePassphrase: protectedProcedure
      .input(
         z.object({
            oldKeyHash: z.string().min(1),
            newSalt: z.string().min(1),
            newKeyHash: z.string().min(1),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw new Error("User not found");
         }

         // Verify the old key hash first
         const userData = await resolvedCtx.db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, userId),
            columns: {
               encryptionKeyHash: true,
               encryptionEnabled: true,
            },
         });

         if (!userData?.encryptionEnabled) {
            throw new Error("Encryption is not enabled");
         }

         if (userData.encryptionKeyHash !== input.oldKeyHash) {
            throw new Error("Invalid current passphrase");
         }

         // Update encryption settings
         await resolvedCtx.db
            .update(user)
            .set({
               encryptionSalt: input.newSalt,
               encryptionKeyHash: input.newKeyHash,
            })
            .where(eq(user.id, userId));

         return { success: true };
      }),
});
