import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

export function HomeHeaderSection() {
   return (
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">
               {translate("dashboard.routes.home.title")}
            </h2>
            <p className="text-muted-foreground">
               {translate("dashboard.routes.home.description")}
            </p>
         </div>
         <Button asChild>
            <Link to="/reports">
               {translate("dashboard.routes.home.view-detailed-reports")}
               <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
         </Button>
      </div>
   );
}
