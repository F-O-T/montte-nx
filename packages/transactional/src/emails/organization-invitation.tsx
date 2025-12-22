import { Button, Section, Text } from "@react-email/components";
import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface OrganizationInvitationEmailProps {
   invitedByUsername: string;
   invitedByEmail: string;
   teamName: string;
   inviteLink: string;
}

export default function OrganizationInvitationEmail({
   invitedByUsername,
   invitedByEmail,
   teamName,
   inviteLink,
}: OrganizationInvitationEmailProps) {
   return (
      <DefaultEmailLayout preview={`Você foi convidado para ${teamName}`}>
         <DefaultHeading />
         <Section style={{ padding: "32px 24px", textAlign: "center" }}>
            <Text
               style={{
                  color: "#1a1a2e",
                  fontSize: "22px",
                  fontWeight: 600,
                  lineHeight: "28px",
                  margin: "0 0 8px 0",
               }}
            >
               Você foi convidado!
            </Text>
            <Text
               style={{
                  color: "#6b7280",
                  fontSize: "15px",
                  lineHeight: "24px",
                  margin: "0 0 24px 0",
               }}
            >
               <strong style={{ color: "#1a1a2e" }}>{invitedByUsername}</strong>{" "}
               ({invitedByEmail}) convidou você para fazer parte da organização{" "}
               <strong style={{ color: "#1a1a2e" }}>{teamName}</strong>.
            </Text>
            <Section
               style={{
                  backgroundColor: "#f0fdf4",
                  borderRadius: "12px",
                  margin: "0 0 24px 0",
                  padding: "20px",
               }}
            >
               <Text
                  style={{
                     color: "#0C5343",
                     fontSize: "14px",
                     lineHeight: "22px",
                     margin: "0 0 16px 0",
                  }}
               >
                  Ao aceitar, você terá acesso aos recursos financeiros
                  compartilhados pela equipe.
               </Text>
               <Button
                  href={inviteLink}
                  style={{
                     backgroundColor: "#42B46E",
                     borderRadius: "8px",
                     color: "#ffffff",
                     display: "inline-block",
                     fontSize: "15px",
                     fontWeight: 600,
                     padding: "12px 32px",
                     textDecoration: "none",
                  }}
               >
                  Aceitar convite
               </Button>
            </Section>
            <Text
               style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                  lineHeight: "20px",
                  margin: 0,
               }}
            >
               Se você não esperava este convite, pode ignorar este e-mail com
               segurança.
            </Text>
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

OrganizationInvitationEmail.PreviewProps = {
   invitedByEmail: "maria@exemplo.com",
   invitedByUsername: "Maria Silva",
   inviteLink: "https://app.montte.co/invite/abc123",
   teamName: "Empresa ABC",
} satisfies OrganizationInvitationEmailProps;
