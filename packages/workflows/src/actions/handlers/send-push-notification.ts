import { getOrganizationMembers } from "@packages/database/repositories/auth-repository";
import type { Action } from "@packages/database/schema";
import { sendPushNotificationToUser } from "@packages/notifications/push";
import { createTemplateContext, renderTemplate } from "../../utils/template";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const sendPushNotificationHandler: ActionHandler = {
   type: "send_push_notification",

   async execute(action: Action, context: ActionHandlerContext) {
      const { title, body, url } = action.config;

      if (!title || !body) {
         return createSkippedResult(action, "Title and body are required");
      }

      const templateContext = createTemplateContext(context.eventData);
      const processedTitle = renderTemplate(title, templateContext);
      const processedBody = renderTemplate(body, templateContext);
      const processedUrl = url
         ? renderTemplate(url, templateContext)
         : undefined;

      if (context.dryRun) {
         return createActionResult(action, true, {
            body: processedBody,
            dryRun: true,
            title: processedTitle,
            url: processedUrl,
         });
      }

      try {
         const members = await getOrganizationMembers(
            context.db,
            context.organizationId,
         );
         const owner = members.find((m) => m.role === "owner");

         if (!owner) {
            return createActionResult(
               action,
               false,
               undefined,
               "Organization owner not found",
            );
         }

         const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
         const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
         const vapidSubject =
            process.env.VAPID_SUBJECT ?? "mailto:contato@montte.co";

         const result = await sendPushNotificationToUser({
            db: context.db,
            payload: {
               body: processedBody,
               data: { url: processedUrl },
               title: processedTitle,
            },
            userId: owner.userId,
            vapidPrivateKey,
            vapidPublicKey,
            vapidSubject,
         });

         return createActionResult(action, result.success, {
            body: processedBody,
            errors: result.errors,
            failed: result.failed,
            sent: result.sent,
            title: processedTitle,
            userId: owner.userId,
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(action, false, undefined, message);
      }
   },

   validate(config) {
      const errors: string[] = [];
      if (!config.title) {
         errors.push("Title is required");
      }
      if (!config.body) {
         errors.push("Body is required");
      }
      return { errors, valid: errors.length === 0 };
   },
};
