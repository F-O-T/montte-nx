import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import { Separator } from "@packages/ui/components/separator";
import { Switch } from "@packages/ui/components/switch";
import {
   AlertTriangle,
   Bell,
   BellOff,
   BellRing,
   CreditCard,
   Loader2,
   Receipt,
   Send,
   Wallet,
} from "lucide-react";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function NotificationSettingsCard() {
   const {
      isSupported,
      isEnabled,
      isLoading,
      isPushEnabled,
      permission,
      toggle,
   } = usePushNotifications();

   const {
      preferences,
      isLoading: isLoadingPrefs,
      isUpdating,
      isTesting,
      updatePreference,
      sendTestNotification,
   } = useNotificationPreferences();

   if (!isSupported) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <BellOff className="size-5" />
                  Notificações Push
               </CardTitle>
               <CardDescription>
                  Seu navegador não suporta notificações push.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (!isPushEnabled) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Bell className="size-5" />
                  Notificações Push
               </CardTitle>
               <CardDescription>
                  Notificações push não estão configuradas no servidor.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (permission === "denied") {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <BellOff className="size-5" />
                  Notificações Push
               </CardTitle>
               <CardDescription>
                  Você bloqueou as notificações. Para receber notificações,
                  permita nas configurações do seu navegador.
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <BellRing className="size-5" />
               Notificações Push
            </CardTitle>
            <CardDescription>
               Receba notificações em tempo real sobre suas finanças.
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Item className="p-0">
               <ItemContent>
                  <ItemTitle>Ativar notificações</ItemTitle>
                  <ItemDescription>
                     {isEnabled
                        ? "Você receberá alertas sobre transações, orçamentos e lembretes."
                        : "Ative para receber alertas importantes no seu dispositivo."}
                  </ItemDescription>
               </ItemContent>
               {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
               ) : (
                  <Switch
                     aria-label="Ativar notificações push"
                     checked={isEnabled}
                     onCheckedChange={toggle}
                  />
               )}
            </Item>

            {isEnabled && (
               <>
                  <Separator />

                  <div className="space-y-3">
                     <p className="font-medium text-sm">Tipos de notificação</p>

                     <Item className="p-0">
                        <div className="flex items-center gap-3">
                           <div className="flex size-8 items-center justify-center rounded-md bg-amber-500/10">
                              <Wallet className="size-4 text-amber-500" />
                           </div>
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 Alertas de orçamento
                              </ItemTitle>
                              <ItemDescription className="text-xs">
                                 Quando você atingir limites do orçamento
                              </ItemDescription>
                           </ItemContent>
                        </div>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de orçamento"
                              checked={preferences.budgetAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("budgetAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <Item className="p-0">
                        <div className="flex items-center gap-3">
                           <div className="flex size-8 items-center justify-center rounded-md bg-blue-500/10">
                              <Receipt className="size-4 text-blue-500" />
                           </div>
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 Lembretes de contas
                              </ItemTitle>
                              <ItemDescription className="text-xs">
                                 Antes do vencimento de contas recorrentes
                              </ItemDescription>
                           </ItemContent>
                        </div>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Lembretes de contas"
                              checked={preferences.billReminders}
                              onCheckedChange={(v) =>
                                 updatePreference("billReminders", v)
                              }
                           />
                        )}
                     </Item>

                     <Item className="p-0">
                        <div className="flex items-center gap-3">
                           <div className="flex size-8 items-center justify-center rounded-md bg-red-500/10">
                              <AlertTriangle className="size-4 text-red-500" />
                           </div>
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 Contas vencidas
                              </ItemTitle>
                              <ItemDescription className="text-xs">
                                 Quando houver contas em atraso
                              </ItemDescription>
                           </ItemContent>
                        </div>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de contas vencidas"
                              checked={preferences.overdueAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("overdueAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <Item className="p-0">
                        <div className="flex items-center gap-3">
                           <div className="flex size-8 items-center justify-center rounded-md bg-green-500/10">
                              <CreditCard className="size-4 text-green-500" />
                           </div>
                           <ItemContent>
                              <ItemTitle className="text-sm">
                                 Novas transações
                              </ItemTitle>
                              <ItemDescription className="text-xs">
                                 Quando transações forem adicionadas
                              </ItemDescription>
                           </ItemContent>
                        </div>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label="Alertas de transações"
                              checked={preferences.transactionAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("transactionAlerts", v)
                              }
                           />
                        )}
                     </Item>
                  </div>

                  <Separator />

                  <Button
                     className="w-full"
                     disabled={isTesting}
                     onClick={sendTestNotification}
                     size="sm"
                     variant="outline"
                  >
                     {isTesting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                     ) : (
                        <Send className="mr-2 size-4" />
                     )}
                     Enviar notificação de teste
                  </Button>
               </>
            )}
         </CardContent>
      </Card>
   );
}

export function NotificationPromptBanner({
   onDismiss,
}: {
   onDismiss?: () => void;
}) {
   const {
      isSupported,
      isEnabled,
      isPushEnabled,
      permission,
      isLoading,
      subscribe,
   } = usePushNotifications();

   if (!isSupported || !isPushEnabled || isEnabled || permission === "denied") {
      return null;
   }

   const handleEnable = async () => {
      await subscribe();
   };

   return (
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
         <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
               <Bell className="size-5 text-primary" />
            </div>
            <div>
               <p className="font-medium text-sm">Ative as notificações</p>
               <p className="text-muted-foreground text-xs">
                  Receba alertas sobre suas finanças em tempo real.
               </p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            {onDismiss && (
               <Button onClick={onDismiss} size="sm" variant="ghost">
                  Agora não
               </Button>
            )}
            <Button disabled={isLoading} onClick={handleEnable} size="sm">
               {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
               ) : (
                  "Ativar"
               )}
            </Button>
         </div>
      </div>
   );
}
