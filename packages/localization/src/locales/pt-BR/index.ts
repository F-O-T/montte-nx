import commonActionsPtBr from "./common/actions.json";
import commonBrandPtBr from "./common/brand.json";
import commonHeadersPtBr from "./common/headers.json";
import commonLanguagesPtBr from "./common/languages.json";
import commonValidationPtBr from "./common/validation.json";
import emailVerificationPtBr from "./dashboard/routes/email-verification.json";
import forgotPasswordPtBr from "./dashboard/routes/forgot-password.json";
import homePagePtBr from "./dashboard/routes/home.json";
import profilePtBr from "./dashboard/routes/profile.json";
import signInPtBr from "./dashboard/routes/sign-in.json";
import signUpPtBr from "./dashboard/routes/sign-up.json";
import commonFormPtBr from "./common/form.json";
import commonThemesPtBr from "./common/themes.json";
const resources = {
   translation: {
      common: {
         form: commonFormPtBr,
         actions: commonActionsPtBr,
         brand: commonBrandPtBr,
         headers: commonHeadersPtBr,
         languages: commonLanguagesPtBr,
         validation: commonValidationPtBr,
         themes: commonThemesPtBr,
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
