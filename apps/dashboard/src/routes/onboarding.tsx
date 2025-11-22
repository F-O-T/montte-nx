import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/onboarding")({
   component: OnboardingLayout,
});

function OnboardingLayout() {
   return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
         <div className="w-full max-w-xl space-y-6">
            <Outlet />
         </div>
      </div>
   );
}
