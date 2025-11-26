import { createAuth } from "@packages/authentication/server";
import { serverEnv as env } from "@packages/environment/server";
import { getResendClient } from "@packages/transactional/client";
import { db } from "./database";

export const resendClient = getResendClient(env.RESEND_API_KEY);

export const auth = createAuth({
   db,
   resendClient,
});
