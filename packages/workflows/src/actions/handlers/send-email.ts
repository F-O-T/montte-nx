import { getOrganizationMembers } from "@packages/database/repositories/auth-repository";
import type { Consequence } from "@packages/database/schema";
import { createTemplateContext, renderTemplate } from "../../utils/template";
import {
   type ActionHandler,
   type ActionHandlerContext,
   createActionResult,
   createSkippedResult,
} from "../types";

const EMAIL_FROM = "Montte <suporte@mail.montte.co>";

export const sendEmailHandler: ActionHandler = {
   type: "send_email",

   async execute(consequence: Consequence, context: ActionHandlerContext) {
      const { to, customEmail, subject, body } = consequence.payload;

      if (!subject || !body) {
         return createSkippedResult(consequence, "Subject and body are required");
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
               consequence,
               false,
               undefined,
               "Organization owner email not found",
            );
         }
         recipientEmail = owner.user.email;
      }

      if (context.dryRun) {
         return createActionResult(consequence, true, {
            body: processedBody,
            dryRun: true,
            subject: processedSubject,
            to: recipientEmail,
         });
      }

      if (!context.resendClient) {
         return createActionResult(
            consequence,
            false,
            undefined,
            "Email client not configured",
         );
      }

      try {
         await context.resendClient.emails.send({
            from: EMAIL_FROM,
            html: processedBody,
            subject: processedSubject,
            to: recipientEmail,
         });

         return createActionResult(consequence, true, {
            body: processedBody,
            subject: processedSubject,
            to: recipientEmail,
         });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : "Unknown error";
         return createActionResult(consequence, false, undefined, message);
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
