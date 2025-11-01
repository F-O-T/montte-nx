import { createAuth } from "@packages/authentication/server";
import { serverEnv as env } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import { getResendClient } from "@packages/transactional/client";
import { db } from "./database";

export const resendClient = getResendClient(env.RESEND_API_KEY);
export const polarClient = getPaymentClient(env.POLAR_ACCESS_TOKEN);

export const auth = createAuth({
   db,
   polarClient,
   resendClient,
});
