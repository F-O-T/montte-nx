import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface AddTeamMemberData {
	teamId: string;
	userId: string;
}

interface UseAddTeamMemberOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useAddTeamMember(options?: UseAddTeamMemberOptions) {
	const [isPending, setIsPending] = useState(false);

	const addTeamMember = useCallback(
		async (data: AddTeamMemberData) => {
			setIsPending(true);
			const toastId = toast.loading("Adding team member...");

			try {
				const result = await betterAuthClient.organization.addTeamMember({
					teamId: data.teamId,
					userId: data.userId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Team member added successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to add team member";
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

	return { addTeamMember, isPending };
}
