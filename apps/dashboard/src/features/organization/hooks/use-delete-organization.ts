import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UseDeleteOrganizationOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useDeleteOrganization(options?: UseDeleteOrganizationOptions) {
	const [isPending, setIsPending] = useState(false);

	const deleteOrganization = useCallback(
		async (organizationId: string) => {
			setIsPending(true);
			const toastId = toast.loading("Deleting organization...");

			try {
				const result = await betterAuthClient.organization.delete({
					organizationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Organization deleted successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to delete organization";
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

	return { deleteOrganization, isPending };
}
