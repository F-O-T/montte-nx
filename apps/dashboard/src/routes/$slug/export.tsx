import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ExportWizard } from "@/features/export/ui/export-wizard";

const searchSchema = z.object({
	step: z
		.enum(["select-account", "options", "exporting"])
		.optional()
		.default("select-account"),
	bankAccountId: z.string().optional(),
});

export const Route = createFileRoute("/$slug/export")({
	component: ExportPage,
	validateSearch: searchSchema,
});

function ExportPage() {
	const { slug } = Route.useParams();
	const { step, bankAccountId } = Route.useSearch();

	return (
		<ExportWizard
			initialBankAccountId={bankAccountId}
			initialStep={step}
			slug={slug}
		/>
	);
}
