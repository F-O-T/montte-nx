import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface InviteMemberData {
	email: string;
	role: "member" | "admin" | "owner";
	organizationId?: string;
	teamId?: string;
	resend?: boolean;
}

interface UseInviteMemberOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useInviteMember(options?: UseInviteMemberOptions) {
	const [isPending, setIsPending] = useState(false);

	const inviteMember = useCallback(
		async (data: InviteMemberData) => {
			setIsPending(true);
			const toastId = toast.loading("Sending invitation...");

			try {
				const result = await betterAuthClient.organization.inviteMember({
					email: data.email,
					organizationId: data.organizationId,
					resend: data.resend,
					role: data.role,
					teamId: data.teamId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Invitation sent successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to send invitation";
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

	return { inviteMember, isPending };
}
