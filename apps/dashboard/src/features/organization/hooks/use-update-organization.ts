import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface UpdateOrganizationData {
	organizationId: string;
	name?: string;
	slug?: string;
	logo?: string;
}

interface UseUpdateOrganizationOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useUpdateOrganization(options?: UseUpdateOrganizationOptions) {
	const [isPending, setIsPending] = useState(false);

	const updateOrganization = useCallback(
		async (data: UpdateOrganizationData) => {
			setIsPending(true);
			const toastId = toast.loading("Updating organization...");

			try {
				const result = await betterAuthClient.organization.update({
					data: {
						logo: data.logo,
						name: data.name,
						slug: data.slug,
					},
					organizationId: data.organizationId,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Organization updated successfully", { id: toastId });

				options?.onSuccess?.();

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to update organization";
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

	return { isPending, updateOrganization };
}
