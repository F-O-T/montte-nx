import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

interface RevokePermissionData {
   resourceType: "bank_account";
   resourceId: string;
   granteeType: "user" | "team";
   granteeId: string;
}

interface UseRevokePermissionOptions {
   onSuccess?: () => void;
   onError?: (error: Error) => void;
}

export function useRevokePermission(options?: UseRevokePermissionOptions) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const mutation = useMutation(
      trpc.permissions.revoke.mutationOptions({
         onSuccess: () => {
            // Invalidate permissions queries
            queryClient.invalidateQueries({
               queryKey: trpc.permissions.getForResource.queryKey(),
            });
            toast.success("Permissão revogada com sucesso");
            options?.onSuccess?.();
         },
         onError: (error) => {
            const errorMessage =
               error instanceof Error
                  ? error.message
                  : "Falha ao revogar permissão";
            toast.error(errorMessage);
            options?.onError?.(
               error instanceof Error ? error : new Error(errorMessage),
            );
         },
      }),
   );

   const revokePermission = async (data: RevokePermissionData) => {
      return mutation.mutateAsync(data);
   };

   return {
      revokePermission,
      isPending: mutation.isPending,
   };
}
