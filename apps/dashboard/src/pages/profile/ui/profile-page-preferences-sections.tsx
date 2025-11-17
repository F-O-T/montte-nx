import { translate } from "@packages/localization";

import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Globe, Moon } from "lucide-react";
import { ThemeSwitcher } from "@/layout/theme-provider";
import { LanguageCommand } from "@/layout/language-command";

export function PreferencesSection() {
   return (
      <Card className="flex flex-col h-[300px]">
         <CardHeader className="flex-shrink-0">
            <CardTitle>
               {translate("dashboard.routes.profile.preferences.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.preferences.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-1 overflow-y-auto">
            <ItemGroup>
               {/* Theme Toggle Group */}
               <Item>
                  <ItemMedia variant="icon">
                     <Moon className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <ThemeSwitcher />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Language Selection */}
               <Item>
                  <ItemMedia variant="icon">
                     <Globe className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <LanguageCommand />
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}
