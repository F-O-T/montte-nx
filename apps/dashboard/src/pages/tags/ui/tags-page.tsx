import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { UpgradeRequired } from "@/components/upgrade-required";
import { DefaultHeader } from "@/default/default-header";
import { usePlanFeatures } from "@/hooks/use-plan-features";
import { useSheet } from "@/hooks/use-sheet";
import { ManageTagForm } from "../features/manage-tag-form";
import { TagListProvider } from "../features/tag-list-context";
import { TagsListSection } from "./tags-list-section";
import { TagsStats } from "./tags-stats";

export type Tag = RouterOutput["tags"]["getAllPaginated"]["tags"][0];

export function TagsPage() {
	const { openSheet } = useSheet();
	const { canAccessTags } = usePlanFeatures();

	return (
		<UpgradeRequired
			featureName="Tags"
			hasAccess={canAccessTags}
			requiredPlan="basic"
		>
			<TagListProvider>
				<main className="space-y-4">
					<DefaultHeader
						actions={
							<Button
								onClick={() => openSheet({ children: <ManageTagForm /> })}
							>
								<Plus className="size-4" />
								{translate(
									"dashboard.routes.tags.actions-toolbar.actions.add-new",
								)}
							</Button>
						}
						description={translate(
							"dashboard.routes.tags.list-section.description",
						)}
						title={translate("dashboard.routes.tags.list-section.title")}
					/>
					<TagsStats />
					<TagsListSection />
				</main>
			</TagListProvider>
		</UpgradeRequired>
	);
}
