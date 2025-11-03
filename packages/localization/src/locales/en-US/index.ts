import emailVerificationEnUs from "./dashboard/routes/email-verification.json";
import forgotPasswordEnUs from "./dashboard/routes/forgot-password.json";
import homePageEnUs from "./dashboard/routes/home.json";
import profileEnUs from "./dashboard/routes/profile.json";
import signInEnUs from "./dashboard/routes/sign-in.json";
import signUpEnUs from "./dashboard/routes/sign-up.json";
import commonLanguagesEnUs from "./common/languages.json";
import commonActionsEnUs from "./common/actions.json";
import commonHeadersEnUs from "./common/headers.json";
const resources = {
   translation: {
      common: {
         languages: commonLanguagesEnUs,
         actions: commonActionsEnUs,
         headers: commonHeadersEnUs,
      },
      dashboard: {
         routes: {
            "email-verification": emailVerificationEnUs,
            "forgot-password": forgotPasswordEnUs,
            home: homePageEnUs,
            profile: profileEnUs,
            "sign-in": signInEnUs,
            "sign-up": signUpEnUs,
         },
      },
   },
};

export default resources;
