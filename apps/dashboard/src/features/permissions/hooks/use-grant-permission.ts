import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface GrantPermissionData {
	resourceType: "bank_account";
	resourceId: string;
	granteeType: "user" | "team";
	granteeId: string;
	permission: "view" | "edit" | "manage";
}

interface UseGrantPermissionOptions {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useGrantPermission(options?: UseGrantPermissionOptions) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const mutation = useMutation(
		trpc.permissions.grant.mutationOptions({
			onSuccess: () => {
				// Invalidate permissions queries
				queryClient.invalidateQueries({
					queryKey: trpc.permissions.getForResource.queryKey(),
				});
				toast.success("Permissão concedida com sucesso");
				options?.onSuccess?.();
			},
			onError: (error) => {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Falha ao conceder permissão";
				toast.error(errorMessage);
				options?.onError?.(
					error instanceof Error ? error : new Error(errorMessage),
				);
			},
		}),
	);

	const grantPermission = async (data: GrantPermissionData) => {
		return mutation.mutateAsync(data);
	};

	return {
		grantPermission,
		isPending: mutation.isPending,
	};
}
