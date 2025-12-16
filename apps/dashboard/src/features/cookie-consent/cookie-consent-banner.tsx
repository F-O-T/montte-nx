import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
import { Cookie, Loader2 } from "lucide-react";
import { useCookieConsent } from "./use-cookie-consent";
import { trpc } from "@/integrations/clients";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function CookieConsentBanner() {
  const { consent, accept, decline, isHydrated } = useCookieConsent();

  const updateTelemetry = useMutation(
    trpc.session.updateTelemetryConsent.mutationOptions({
      onError: () => {
        toast.error(translate("common.errors.default"));
      },
    })
  );

  if (!isHydrated || consent !== null) return null;

  const handleAccept = async () => {
    try {
      await updateTelemetry.mutateAsync({ consent: true });
      accept();
      toast.success(translate("common.cookies.banner.accepted"));
    } catch {
      // Error already handled by mutation onError
    }
  };

  const handleDecline = async () => {
    try {
      await updateTelemetry.mutateAsync({ consent: false });
      decline();
      toast.success(translate("common.cookies.banner.declined"));
    } catch {
      // Error already handled by mutation onError
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="p-4 shadow-lg border-2 dark:border-zinc-700">
        <div className="flex items-start gap-3">
          <Cookie className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
          <div className="space-y-3 flex-1 min-w-0">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">
                {translate("common.cookies.banner.title")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {translate("common.cookies.banner.description")}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleAccept}
                disabled={updateTelemetry.isPending}
                size="sm"
                className="flex-1 min-w-fit"
              >
                {updateTelemetry.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                {translate("common.cookies.banner.accept")}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={updateTelemetry.isPending}
                size="sm"
                variant="outline"
                className="flex-1 min-w-fit"
              >
                {updateTelemetry.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                {translate("common.cookies.banner.decline")}
              </Button>
            </div>
            <a
              href="https://montte.co/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:underline inline-block"
            >
              {translate("common.cookies.banner.privacy-policy")}
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
