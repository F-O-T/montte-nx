import { getOrganizationMembers } from "@packages/database/repositories/auth-repository";
import type { Action } from "@packages/database/schema";
import { createTemplateContext, renderTemplate } from "../../utils/template";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

export const sendEmailHandler: ActionHandler = {
   type: "send_email",

   async execute(action: Action, context: ActionHandlerContext) {
      const { to, customEmail, subject, body } = action.config;

      if (!subject || !body) {
         return createSkippedResult(action, "Subject and body are required");
      }

      const templateContext = createTemplateContext(context.eventData);
      const processedSubject = renderTemplate(subject, templateContext);
      const processedBody = renderTemplate(body, templateContext);

      let recipientEmail: string;

      if (to === "custom" && customEmail) {
         recipientEmail = customEmail;
      } else {
         const members = await getOrganizationMembers(
            context.db,
            context.organizationId,
         );
         const owner = members.find((m) => m.role === "owner");

         if (!owner?.user?.email) {
            return createActionResult(
               action,
               false,
               undefined,
               "Organization owner email not found",
            );
         }
         recipientEmail = owner.user.email;
      }

      if (context.dryRun) {
         return createActionResult(action, true, {
            body: processedBody,
            dryRun: true,
            subject: processedSubject,
            to: recipientEmail,
         });
      }

      try {
         // TODO: Integrate with @packages/transactional for actual email sending
         console.log("[Workflow] Send email action:", {
            body: processedBody,
            subject: processedSubject,
            to: recipientEmail,
         });

         return createActionResult(action, true, {
            body: processedBody,
            subject: processedSubject,
            to: recipientEmail,
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(action, false, undefined, message);
      }
   },

   validate(config) {
      const errors: string[] = [];
      if (!config.subject) {
         errors.push("Subject is required");
      }
      if (!config.body) {
         errors.push("Body is required");
      }
      if (config.to === "custom" && !config.customEmail) {
         errors.push(
            "Custom email is required when recipient is set to custom",
         );
      }
      return { errors, valid: errors.length === 0 };
   },
};
