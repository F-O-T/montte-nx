import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UseAcceptInvitationOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useAcceptInvitation(options?: UseAcceptInvitationOptions) {
	const [isPending, setIsPending] = useState(false);

	const acceptInvitation = useCallback(
		async (invitationId: string) => {
			setIsPending(true);
			const toastId = toast.loading("Accepting invitation...");

			try {
				const result = await betterAuthClient.organization.acceptInvitation({
					invitationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Invitation accepted successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to accept invitation";
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

	return { acceptInvitation, isPending };
}
