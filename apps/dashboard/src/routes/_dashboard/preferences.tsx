import { createFileRoute } from "@tanstack/react-router";
import { PreferencesPage } from "../../pages/preferences/ui/preferences-page";

export const Route = createFileRoute("/_dashboard/preferences")({
   component: PreferencesPage,
});
