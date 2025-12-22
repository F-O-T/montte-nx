import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface RemoveTeamMemberData {
	teamId: string;
	userId: string;
}

interface UseRemoveTeamMemberOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useRemoveTeamMember(options?: UseRemoveTeamMemberOptions) {
	const [isPending, setIsPending] = useState(false);

	const removeTeamMember = useCallback(
		async (data: RemoveTeamMemberData) => {
			setIsPending(true);
			const toastId = toast.loading("Removing team member...");

			try {
				const result = await betterAuthClient.organization.removeTeamMember({
					teamId: data.teamId,
					userId: data.userId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Team member removed successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to remove team member";
				toast.error(errorMessage, { id: toastId });
				options?.onError?.(
					error instanceof Error ? error : new Error(errorMessage),
				);
				throw error;
			} finally {
				setIsPending(false);
			}
		},
		[options],
	);

	return { isPending, removeTeamMember };
}
