import { createAuth } from "@packages/authentication/server";
import { serverEnv as env } from "@packages/environment/server";
import { getResendClient } from "@packages/transactional/client";
import { openAPI } from "better-auth/plugins";
import { db } from "./database";

export const resendClient = getResendClient(env.RESEND_API_KEY);

export const auth = createAuth({
   db,
   resendClient,
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
   components: getSchema().then(({ components }) => components) as Promise<any>,
   getPaths: (prefix = "/auth/api") =>
      getSchema().then(({ paths }) => {
         const reference: typeof paths = Object.create(null);

         for (const path of Object.keys(paths)) {
            const key = prefix + path;
            reference[key] = paths[path];

            for (const method of Object.keys(paths[path])) {
               const operation = (reference[key] as any)[method];

               operation.tags = ["Better Auth"];
            }
         }

         return reference;
      }) as Promise<any>,
} as const;
