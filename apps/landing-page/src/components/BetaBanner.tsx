"use client";

import {
   Banner,
   BannerClose,
   BannerIcon,
   BannerTitle,
} from "@packages/ui/components/banner";
import { FlaskConicalIcon } from "lucide-react";

export function BetaBanner() {
   return (
      <div className="fixed top-16 inset-x-0 z-40">
         <Banner className="justify-center">
            <BannerIcon icon={FlaskConicalIcon} />
            <BannerTitle className="flex-none">
               This app is in beta. Features may change or be removed.
            </BannerTitle>
            <BannerClose />
         </Banner>
      </div>
   );
}
