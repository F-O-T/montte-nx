import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface CreateTeamData {
	name: string;
	description?: string;
	organizationId?: string;
}

interface UseCreateTeamOptions {
	onSuccess?: (data: { id: string; name: string }) => void;
	onError?: (error: Error) => void;
}

export function useCreateTeam(options?: UseCreateTeamOptions) {
	const [isPending, setIsPending] = useState(false);

	const createTeam = useCallback(
		async (data: CreateTeamData) => {
			setIsPending(true);
			const toastId = toast.loading("Creating team...");

			try {
				const result = await betterAuthClient.organization.createTeam({
					name: data.name,
					organizationId: data.organizationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Team created successfully", { id: toastId });

				options?.onSuccess?.({
					id: result.data?.id ?? "",
					name: result.data?.name ?? "",
				});

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to create team";
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

	return { createTeam, isPending };
}
