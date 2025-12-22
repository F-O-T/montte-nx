import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UseDeclineInvitationOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useDeclineInvitation(options?: UseDeclineInvitationOptions) {
	const [isPending, setIsPending] = useState(false);

	const declineInvitation = useCallback(
		async (invitationId: string) => {
			setIsPending(true);
			const toastId = toast.loading("Declining invitation...");

			try {
				const result = await betterAuthClient.organization.rejectInvitation({
					invitationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Invitation declined", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to decline invitation";
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

	return { declineInvitation, isPending };
}
