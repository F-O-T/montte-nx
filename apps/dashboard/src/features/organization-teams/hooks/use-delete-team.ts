import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UseDeleteTeamOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useDeleteTeam(options?: UseDeleteTeamOptions) {
	const [isPending, setIsPending] = useState(false);

	const deleteTeam = useCallback(
		async (teamId: string) => {
			setIsPending(true);
			const toastId = toast.loading("Deleting team...");

			try {
				const result = await betterAuthClient.organization.removeTeam({
					teamId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Team deleted successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to delete team";
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

	return { deleteTeam, isPending };
}
