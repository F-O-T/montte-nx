import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";

export function HomeHeaderSection() {
   return (
      <DefaultHeader
         description={translate("dashboard.routes.home.description")}
         title={translate("dashboard.routes.home.title")}
      />
   );
}
