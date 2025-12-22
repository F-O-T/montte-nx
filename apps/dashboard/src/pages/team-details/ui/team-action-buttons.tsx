import { Button } from "@packages/ui/components/button";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteTeam } from "@/features/organization-teams/hooks/use-delete-team";
import { useAlertDialog } from "@/hooks/use-alert-dialog";

interface TeamActionButtonsProps {
	teamId: string;
	onDeleteSuccess?: () => void;
}

export function TeamActionButtons({
	teamId,
	onDeleteSuccess,
}: TeamActionButtonsProps) {
	const { openAlertDialog } = useAlertDialog();
	const { deleteTeam, isPending } = useDeleteTeam({
		onSuccess: onDeleteSuccess,
	});

	const handleDelete = () => {
		openAlertDialog({
			actionLabel: "Delete Team",
			description:
				"This action will permanently delete this team. Members will remain in the organization but will be removed from this team.",
			onAction: async () => {
				await deleteTeam(teamId);
			},
			title: "Delete Team",
			variant: "destructive",
		});
	};

	return (
		<div className="flex gap-2">
			<Button size="sm" variant="outline">
				<Pencil className="size-4 mr-2" />
				Edit Team
			</Button>
			<Button
				size="sm"
				variant="outline"
				className="text-destructive hover:text-destructive"
				onClick={handleDelete}
				disabled={isPending}
			>
				<Trash2 className="size-4 mr-2" />
				Delete Team
			</Button>
		</div>
	);
}
