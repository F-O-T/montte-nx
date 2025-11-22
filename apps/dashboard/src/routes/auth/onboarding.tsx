import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/pages/onboarding/ui/onboarding-page";

export const Route = createFileRoute("/auth/onboarding")({
   component: RouteComponent,
});

function RouteComponent() {
   return <OnboardingPage />;
}
