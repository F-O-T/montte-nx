import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ImportWizard } from "@/features/import/ui/import-wizard";

const searchSchema = z.object({
   step: z
      .enum([
         "select-account",
         "upload",
         "column-mapping",
         "preview",
         "importing",
      ])
      .optional()
      .default("select-account"),
   bankAccountId: z.string().optional(),
});

export const Route = createFileRoute("/$slug/import")({
   component: ImportPage,
   validateSearch: searchSchema,
});

function ImportPage() {
   const { step, bankAccountId } = Route.useSearch();
   const { slug } = Route.useParams();

   return (
      <ImportWizard
         initialBankAccountId={bankAccountId}
         initialStep={step}
         slug={slug}
      />
   );
}
