import { getDomain } from "@packages/environment/helpers";
import { translate, type TranslationKey } from "@packages/localization";
import { APIError, propagateError } from "@packages/utils/errors";
import { APIError as BetterAuthAPIError } from "better-auth/api";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

const otpSchema = z.enum(["email-verification", "sign-in", "forget-password"]);
export const authRouter = router({
   forgotPassword: publicProcedure

      .input(
         z.object({
            email: z.email("Invalid email format"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { email } = input;

         const forgotPasswordResponse =
            await resolvedCtx.auth.api.forgetPassword({
               body: {
                  email,
               },
               headers: resolvedCtx.headers,
            });

         return forgotPasswordResponse;
      }),
   googleSignIn: publicProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const googleSignInResponse = await resolvedCtx.auth.api.signInSocial({
         body: {
            callbackURL: `${getDomain()}/profile`,
            provider: "google",
         },

         headers: resolvedCtx.headers,
      });

      return googleSignInResponse;
   }),

   resetPassword: publicProcedure
      .input(
         z.object({
            email: z.email("Invalid email format"),
            otp: z.string().min(6, "Token is required"),
            password: z
               .string()
               .min(8, "Password must be at least 8 characters"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { otp, password, email } = input;

         const resetPasswordResponse =
            await resolvedCtx.auth.api.resetPasswordEmailOTP({
               body: {
                  email,
                  otp,
                  password,
               },
               headers: resolvedCtx.headers,
            });

         return resetPasswordResponse;
      }),
   sendVerificationOTP: publicProcedure
      .input(
         z.object({
            email: z.email("Invalid email format"),
            type: otpSchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { email, type } = input;

         const sendOTPResponse = await resolvedCtx.auth.api.sendVerificationOTP(
            {
               body: {
                  email,
                  type,
               },
               headers: resolvedCtx.headers,
            },
         );

         return sendOTPResponse;
      }),
   signIn: publicProcedure
      .input(
         z.object({
            email: z.email("Invalid email format"),
            password: z.string().min(1, "Password is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { email, password } = input;

         try {
            const signInResponse = await resolvedCtx.auth.api.signInEmail({
               body: {
                  email,
                  password,
               },
               headers: resolvedCtx.headers,
            });

            return signInResponse;
         } catch (error) {
            console.error("Sign-in error:", error);
            propagateError(error);
            throw APIError.internal("Failed to sign in. Please try again.");
         }
      }),

   signUp: publicProcedure
      .input(
         z.object({
            email: z.email("Invalid email format"),
            name: z.string().min(1, "Name is required"),
            password: z
               .string()
               .min(8, "Password must be at least 8 characters"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { email, password, name } = input;

         try {
            const signUpResponse = await resolvedCtx.auth.api.signUpEmail({
               body: {
                  email,
                  name,
                  password,
               },
               headers: resolvedCtx.headers,
            });

            return {
               ...signUpResponse,
            };
         } catch (error) {
            if (error instanceof BetterAuthAPIError) {
               const translatedMessage = translate(
                  `dashboard.routes.sign-up.error-codes.${
                     error.body?.code ?? ""
                  }` as TranslationKey,
               );
               throw APIError.unprocessableContent(translatedMessage);
            }
         }
      }),

   verifyEmail: publicProcedure
      .input(
         z.object({
            email: z.email(),
            otp: z.string().min(6, "Token is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { otp, email } = input;

         const verifyEmailResponse = await resolvedCtx.auth.api.verifyEmailOTP({
            body: {
               email,
               otp,
            },
            headers: resolvedCtx.headers,
         });

         return verifyEmailResponse;
      }),
   verifyOTP: publicProcedure
      .input(
         z.object({
            email: z.email("Invalid email format"),
            otp: z.string().min(1, "OTP is required"),
            type: otpSchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const { email, otp, type } = input;

         const verifyOTPResponse =
            await resolvedCtx.auth.api.checkVerificationOTP({
               body: {
                  email,
                  otp,
                  type,
               },
               headers: resolvedCtx.headers,
            });

         return verifyOTPResponse;
      }),
});
