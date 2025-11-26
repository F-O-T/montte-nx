import type { ClientEnv } from "@packages/environment/client";
import { isClientProduction } from "@packages/environment/helpers";
import { PostHogProvider } from "posthog-js/react";

type PosthogEnv = Pick<ClientEnv, "VITE_POSTHOG_HOST" | "VITE_POSTHOG_KEY">;

export function getReactPosthogConfig(env: PosthogEnv) {
   return {
      api_host: env.VITE_POSTHOG_HOST,
      api_key: env.VITE_POSTHOG_KEY,
   };
}
export function getAstroPosthogConfig(env: PosthogEnv) {
   return `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${env.VITE_POSTHOG_KEY}', {
api_host:'${env.VITE_POSTHOG_HOST}',
defaults: '2025-05-24'
})
`;
}

export function PostHogWrapper({
   children,
   env,
   hasConsent = true,
}: {
   children: React.ReactNode;
   env: PosthogEnv;
   hasConsent?: boolean;
}) {
   return (
      <PostHogProvider
         apiKey={env.VITE_POSTHOG_KEY}
         options={{
            ...getReactPosthogConfig(env),
            disable_session_recording: !isClientProduction,
            opt_out_capturing_by_default: !hasConsent,
         }}
      >
         {children}
      </PostHogProvider>
   );
}
