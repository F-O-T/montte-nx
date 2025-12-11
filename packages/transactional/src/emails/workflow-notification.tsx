import { Section } from "@react-email/components";
import { DefaultFooter } from "./default-footer";
import { DefaultHeading } from "./default-heading";
import { DefaultEmailLayout } from "./default-layout";

interface WorkflowNotificationEmailProps {
   body: string;
}

export default function WorkflowNotificationEmail({
   body,
}: WorkflowNotificationEmailProps) {
   return (
      <DefaultEmailLayout>
         <DefaultHeading />
         <Section className="bg-white p-4 space-y-2 rounded-t-lg">
            <div
               className="text-foreground text-base"
               dangerouslySetInnerHTML={{ __html: body }}
            />
         </Section>
         <DefaultFooter />
      </DefaultEmailLayout>
   );
}

WorkflowNotificationEmail.PreviewProps = {
   body: "<p>Hello!</p><p>A new transaction of <strong>R$ 150,00</strong> was created in your account.</p><p>Description: Monthly subscription payment</p>",
};
