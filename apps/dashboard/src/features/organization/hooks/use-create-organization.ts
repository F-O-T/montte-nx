import { useCallback, useState } from "react";
import { toast } from "sonner";
import { betterAuthClient } from "@/integrations/clients";

interface CreateOrganizationData {
	name: string;
	slug: string;
	description?: string;
	logo?: string;
}

interface UseCreateOrganizationOptions {
	onSuccess?: (data: { id: string; slug: string }) => void;
	onError?: (error: Error) => void;
}

export function useCreateOrganization(options?: UseCreateOrganizationOptions) {
	const [isPending, setIsPending] = useState(false);

	const createOrganization = useCallback(
		async (data: CreateOrganizationData) => {
			setIsPending(true);
			const toastId = toast.loading("Creating organization...");

			try {
				const result = await betterAuthClient.organization.create({
					name: data.name,
					slug: data.slug,
				});

				if (result.error) {
					throw new Error(result.error.message);
				}

				toast.success("Organization created successfully", { id: toastId });

				options?.onSuccess?.(result.data);

				return result.data;
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to create organization";
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

	return { createOrganization, isPending };
}
