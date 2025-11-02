import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQuery } from "@tanstack/react-query";
import { PreferencesForm } from "../features/preferences-form";
import { trpc } from "@/integrations/clients";

function PreferencesContent() {
   const { data: preferences } = useQuery(trpc.preferences.get.queryOptions());

   return (
      <div className="space-y-8">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
            <p className="text-muted-foreground mt-1">
               Configure your account settings and preferences
            </p>
         </div>

         <PreferencesForm initialPreferences={preferences} />
      </div>
   );
}

function PreferencesErrorFallback({
   error,
   resetErrorBoundary,
}: {
   error: Error;
   resetErrorBoundary: () => void;
}) {
   return (
      <div className="flex items-center justify-center h-96">
         <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">
               Failed to load preferences
            </h2>
            <p className="text-muted-foreground">
               {error.message || "An unexpected error occurred"}
            </p>
            <button
               onClick={resetErrorBoundary}
               className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
               Try again
            </button>
         </div>
      </div>
   );
}

export function PreferencesPage() {
   return (
      <ErrorBoundary FallbackComponent={PreferencesErrorFallback}>
         <Suspense
            fallback={
               <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                     <p className="text-muted-foreground">
                        Loading preferences...
                     </p>
                  </div>
               </div>
            }
         >
            <PreferencesContent />
         </Suspense>
      </ErrorBoundary>
   );
}
