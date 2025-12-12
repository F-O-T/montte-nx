import { AppError } from "@packages/utils/errors";
import type { Resend } from "resend";
import OrganizationInvitationEmail from "./emails/organization-invitation";
import OTPEmail from "./emails/otp";
import WorkflowNotificationEmail from "./emails/workflow-notification";
import type { SendWorkflowEmailOptions } from "./utils";

export type { SendWorkflowEmailOptions };
export { getResendClient, type ResendClient } from "./utils";

export interface SendEmailOTPOptions {
   email: string;
   otp: string;
   type: "sign-in" | "email-verification" | "forget-password";
}

export interface SendOrganizationInvitationOptions {
   email: string;
   invitedByUsername: string;
   invitedByEmail: string;
   teamName: string;
   inviteLink: string;
}
const name = "Finance tracker";
export const sendOrganizationInvitation = async (
   client: Resend,
   {
      email,
      invitedByUsername,
      invitedByEmail,
      teamName,
      inviteLink,
   }: SendOrganizationInvitationOptions,
) => {
   const subject = `Convite para se juntar à equipe ${teamName} no ContentaGen`;
   await client.emails.send({
      from: `${name} <suporte@montte.co>`,
      react: (
         <OrganizationInvitationEmail
            invitedByEmail={invitedByEmail}
            invitedByUsername={invitedByUsername}
            inviteLink={inviteLink}
            teamName={teamName}
         />
      ),
      subject,
      to: email,
   });
};

export const sendEmailOTP = async (
   client: Resend,
   { email, otp, type }: SendEmailOTPOptions,
) => {
   const getSubject = () => {
      switch (type) {
         case "sign-in":
            return "Faça login na sua conta";
         case "email-verification":
            return "Verifique seu e-mail";
         case "forget-password":
            return "Redefina sua senha";
         default:
            return "Verifique seu e-mail";
      }
   };
   await client.emails.send({
      from: `${name} <suporte@montte.co>`,
      react: <OTPEmail otp={otp} type={type} />,
      subject: getSubject(),
      to: email,
   });
};

export const sendWorkflowEmail = async (
   client: Resend,
   { to, subject, body }: SendWorkflowEmailOptions,
) => {
   await client.emails.send({
      from: `${name} <suporte@montte.co>`,
      react: <WorkflowNotificationEmail body={body} />,
      subject,
      to,
   });
};
