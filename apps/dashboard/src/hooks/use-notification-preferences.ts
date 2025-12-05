import { useTRPC } from "@/integrations/clients";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface NotificationPreferences {
   budgetAlerts: boolean;
   billReminders: boolean;
   overdueAlerts: boolean;
   transactionAlerts: boolean;
}

export function useNotificationPreferences() {
   const trpc = useTRPC();
   const queryClient = useQueryClient();

   const { data: preferences, isLoading } = useQuery(
      trpc.pushNotifications.getPreferences.queryOptions(),
   );

   const updateMutation = useMutation(
      trpc.pushNotifications.updatePreferences.mutationOptions({
         onMutate: async (newPrefs) => {
            await queryClient.cancelQueries({
               queryKey: trpc.pushNotifications.getPreferences.queryKey(),
            });

            const previousPrefs = queryClient.getQueryData(
               trpc.pushNotifications.getPreferences.queryKey(),
            );

            queryClient.setQueryData(
               trpc.pushNotifications.getPreferences.queryKey(),
               (old: NotificationPreferences | undefined) =>
                  old
                     ? ({
                          budgetAlerts: old.budgetAlerts,
                          billReminders: old.billReminders,
                          overdueAlerts: old.overdueAlerts,
                          transactionAlerts: old.transactionAlerts,
                          ...newPrefs,
                       } as NotificationPreferences)
                     : undefined,
            );

            return { previousPrefs };
         },
         onError: (_err, _newPrefs, context) => {
            if (context?.previousPrefs) {
               queryClient.setQueryData(
                  trpc.pushNotifications.getPreferences.queryKey(),
                  context.previousPrefs,
               );
            }
         },
         onSettled: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.pushNotifications.getPreferences.queryKey(),
            });
         },
      }),
   );

   const testMutation = useMutation(
      trpc.pushNotifications.testNotification.mutationOptions(),
   );

   const updatePreference = async (
      key: keyof NotificationPreferences,
      value: boolean,
   ) => {
      await updateMutation.mutateAsync({ [key]: value });
   };

   const sendTestNotification = async () => {
      return testMutation.mutateAsync();
   };

   return {
      preferences: preferences ?? {
         budgetAlerts: true,
         billReminders: true,
         overdueAlerts: true,
         transactionAlerts: false,
      },
      isLoading,
      isUpdating: updateMutation.isPending,
      isTesting: testMutation.isPending,
      updatePreference,
      sendTestNotification,
      testError: testMutation.error,
      testSuccess: testMutation.isSuccess,
   };
}
