import {
   type EarlyAccessFeature,
   useEarlyAccessFeatures,
} from "@packages/posthog/client";
import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { cn } from "@packages/ui/lib/utils";
import { BeakerIcon, ExternalLink, Sparkles } from "lucide-react";

const STAGE_CONFIG = {
   alpha: {
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      label: "Alpha",
   },
   beta: {
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      label: "Beta",
   },
   concept: {
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      label: "Conceito",
   },
};

function FeatureItem({
   feature,
   isEnrolled,
   onToggle,
}: {
   feature: EarlyAccessFeature;
   isEnrolled: boolean;
   onToggle: (flagKey: string, enrolled: boolean) => void;
}) {
   const stageConfig = STAGE_CONFIG[feature.stage] || STAGE_CONFIG.beta;

   return (
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
         <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
               <span className="font-medium">{feature.name}</span>
               <Badge
                  className={cn("text-xs", stageConfig.color)}
                  variant="outline"
               >
                  {stageConfig.label}
               </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
               {feature.description}
            </p>
            {feature.documentationUrl && (
               <a
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  href={feature.documentationUrl}
                  rel="noopener noreferrer"
                  target="_blank"
               >
                  Saiba mais
                  <ExternalLink className="size-3" />
               </a>
            )}
         </div>
         {feature.flagKey && (
            <Switch
               checked={isEnrolled}
               onCheckedChange={(checked) =>
                  onToggle(feature.flagKey as string, checked)
               }
            />
         )}
      </div>
   );
}

function FeatureItemSkeleton() {
   return (
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
         <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
               <Skeleton className="h-5 w-32" />
               <Skeleton className="h-5 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
         </div>
         <Skeleton className="h-6 w-10" />
      </div>
   );
}

export function EarlyAccessFeaturesCard() {
   const { features, isEnrolled, loaded, updateEnrollment } =
      useEarlyAccessFeatures();

   console.log("[DEBUG] EarlyAccessFeaturesCard render:", {
      features: features.length,
      featuresList: features.map((f) => ({ flagKey: f.flagKey, name: f.name })),
      loaded,
   });

   return (
      <Card>
         <CardHeader>
            <div className="flex items-center gap-2">
               <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="size-5 text-primary" />
               </div>
               <div>
                  <CardTitle className="text-lg">Acesso Antecipado</CardTitle>
                  <CardDescription>
                     Experimente novos recursos antes de todos
                  </CardDescription>
               </div>
            </div>
         </CardHeader>
         <CardContent className="space-y-4">
            {!loaded ? (
               <>
                  <FeatureItemSkeleton />
                  <FeatureItemSkeleton />
               </>
            ) : features.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BeakerIcon className="size-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm font-medium">
                     Nenhum recurso disponivel
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                     Novos recursos em acesso antecipado aparecerão aqui
                  </p>
               </div>
            ) : (
               features.map((feature) => (
                  <FeatureItem
                     feature={feature}
                     isEnrolled={isEnrolled(feature.flagKey || "")}
                     key={feature.flagKey || feature.name}
                     onToggle={updateEnrollment}
                  />
               ))
            )}
            <p className="text-xs text-muted-foreground">
               Recursos em acesso antecipado podem estar incompletos ou conter
               bugs. Seu feedback nos ajuda a melhorá-los.
            </p>
         </CardContent>
      </Card>
   );
}
