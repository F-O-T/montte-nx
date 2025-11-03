import emailVerificationPtBr from "./dashboard/routes/email-verification.json";
import forgotPasswordPtBr from "./dashboard/routes/forgot-password.json";
import homePagePtBr from "./dashboard/routes/home.json";
import profilePtBr from "./dashboard/routes/profile.json";
import signInPtBr from "./dashboard/routes/sign-in.json";
import signUpPtBr from "./dashboard/routes/sign-up.json";
import commonActionsPtBr from "./common/actions.json";
import commonLanguagesPtBr from "./common/languages.json";
import commonHeadersPtBr from "./common/headers.json";
const resources = {
   translation: {
      common: {
         languages: commonLanguagesPtBr,
         actions: commonActionsPtBr,
         headers: commonHeadersPtBr,
      },
      dashboard: {
         routes: {
            "email-verification": emailVerificationPtBr,
            "forgot-password": forgotPasswordPtBr,
            home: homePagePtBr,
            profile: profilePtBr,
            "sign-in": signInPtBr,
            "sign-up": signUpPtBr,
         },
      },
   },
};

export default resources;
