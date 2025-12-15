import { Button } from "@packages/ui/components/button";
import { Card } from "@packages/ui/components/card";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "./use-cookie-consent";
import { useTRPC } from "@/integrations/clients";
import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function CookieConsentBanner() {
  const { consent, accept, decline, isHydrated } = useCookieConsent();
  const trpc = useTRPC();

  const updateTelemetry = useMutation({
    mutationFn: (telemetryConsent: boolean) =>
      trpc.session.updateTelemetryConsent.mutate({ consent: telemetryConsent }),
    onError: () => {
      toast.error(translate("common.errors.default"));
    },
  });

  if (!isHydrated || consent !== null) return null;

  const handleAccept = async () => {
    accept();
    await updateTelemetry.mutateAsync(true);
    toast.success(translate("common.cookies.banner.accepted"));
  };

  const handleDecline = async () => {
    decline();
    await updateTelemetry.mutateAsync(false);
    toast.success(translate("common.cookies.banner.declined"));
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
                {translate("common.cookies.banner.accept")}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={updateTelemetry.isPending}
                size="sm"
                variant="outline"
                className="flex-1 min-w-fit"
              >
                {translate("common.cookies.banner.decline")}
              </Button>
            </div>
            <a
              href="/privacy"
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
