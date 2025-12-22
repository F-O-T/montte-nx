import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UpdateTeamData {
	teamId: string;
	name?: string;
}

interface UseUpdateTeamOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useUpdateTeam(options?: UseUpdateTeamOptions) {
	const [isPending, setIsPending] = useState(false);

	const updateTeam = useCallback(
		async (data: UpdateTeamData) => {
			setIsPending(true);
			const toastId = toast.loading("Updating team...");

			try {
				const result = await betterAuthClient.organization.updateTeam({
					data: {
						name: data.name,
					},
					teamId: data.teamId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Team updated successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to update team";
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

	return { isPending, updateTeam };
}
