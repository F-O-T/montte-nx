import { useEffect, useRef } from "react";
import { useTRPC } from "@/integrations/clients";
import { useMutation } from "@tanstack/react-query";

interface UseBillReminderCheckOptions {
   enabled?: boolean;
   reminderDaysBefore?: number;
}

export function useBillReminderCheck(
   options: UseBillReminderCheckOptions = {},
) {
   const { enabled = true, reminderDaysBefore } = options;
   const trpc = useTRPC();
   const hasCheckedRef = useRef(false);

   const checkMutation = useMutation(
      trpc.pushNotifications.checkBillReminders.mutationOptions(),
   );

   useEffect(() => {
      if (!enabled || hasCheckedRef.current) {
         return;
      }

      hasCheckedRef.current = true;

      checkMutation.mutate(
         reminderDaysBefore ? { reminderDaysBefore } : undefined,
      );
   }, [enabled, reminderDaysBefore, checkMutation]);

   return {
      isChecking: checkMutation.isPending,
      results: checkMutation.data?.results,
      error: checkMutation.error,
      recheck: () => {
         checkMutation.mutate(
            reminderDaysBefore ? { reminderDaysBefore } : undefined,
         );
      },
   };
}
