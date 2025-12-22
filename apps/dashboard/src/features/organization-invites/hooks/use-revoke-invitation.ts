import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UseRevokeInvitationOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useRevokeInvitation(options?: UseRevokeInvitationOptions) {
	const [isPending, setIsPending] = useState(false);

	const revokeInvitation = useCallback(
		async (invitationId: string) => {
			setIsPending(true);
			const toastId = toast.loading("Revoking invitation...");

			try {
				const result = await betterAuthClient.organization.cancelInvitation({
					invitationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Invitation revoked successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to revoke invitation";
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

	return { isPending, revokeInvitation };
}
