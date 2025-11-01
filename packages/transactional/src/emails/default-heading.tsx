import { Heading, Img, Section } from "@react-email/components";

export const DefaultHeading = () => {
   return (
      <Section>
         <Img
            alt={"finance-tracker-logo"}
            className="w-20 h-20 rounded-full border-2 border-[var(--color-border)] shadow-sm mx-auto"
         />
         <Heading className="text-center">Finance tracker</Heading>
      </Section>
   );
};
