import { isProduction } from "@packages/environment/helpers";
import { AppError } from "@packages/utils/errors";
import { Polar } from "@polar-sh/sdk";
export function getPaymentClient(POLAR_ACCESS_TOKEN: string) {
   if (!POLAR_ACCESS_TOKEN) {
      throw AppError.validation("POLAR_ACCESS_TOKEN is required");
   }
   const internalClient = new Polar({
      accessToken: POLAR_ACCESS_TOKEN,
      server: isProduction ? "production" : "sandbox",
   });
   return internalClient;
}

export type PaymentClient = ReturnType<typeof getPaymentClient>;
