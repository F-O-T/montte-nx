import commonActionsPtBr from "./common/actions.json";
import commonBrandPtBr from "./common/brand.json";
import commonChartsPtBr from "./common/charts.json";
import commonFormPtBr from "./common/form.json";
import commonHeadersPtBr from "./common/headers.json";
import commonLanguagesPtBr from "./common/languages.json";
import commonThemesPtBr from "./common/themes.json";
import commonValidationPtBr from "./common/validation.json";
import layoutPtBr from "./dashboard/layout.json";
import billsPtBr from "./dashboard/routes/bills.json";
import categoriesPtBr from "./dashboard/routes/categories.json";
import emailVerificationPtBr from "./dashboard/routes/email-verification.json";
import forgotPasswordPtBr from "./dashboard/routes/forgot-password.json";
import homePagePtBr from "./dashboard/routes/home.json";
import organizationPtBr from "./dashboard/routes/organization.json";
import profilePtBr from "./dashboard/routes/profile.json";
import reportsPtBr from "./dashboard/routes/reports.json";
import signInPtBr from "./dashboard/routes/sign-in.json";
import signUpPtBr from "./dashboard/routes/sign-up.json";
import transactionsPtBr from "./dashboard/routes/transactions.json";
import onboardingPtBr from "./dashboard/routes/onboarding.json";

const resources = {
   translation: {
      common: {
         actions: commonActionsPtBr,
         brand: commonBrandPtBr,
         charts: commonChartsPtBr,
         form: commonFormPtBr,
         headers: commonHeadersPtBr,
         languages: commonLanguagesPtBr,
         themes: commonThemesPtBr,
         validation: commonValidationPtBr,
      },
      dashboard: {
         layout: layoutPtBr,
         routes: {
            bills: billsPtBr,
            categories: categoriesPtBr,
            "email-verification": emailVerificationPtBr,
            "forgot-password": forgotPasswordPtBr,
            home: homePagePtBr,
            onboarding: onboardingPtBr,
            organization: organizationPtBr,
            profile: profilePtBr,
            reports: reportsPtBr,
            "sign-in": signInPtBr,
            "sign-up": signUpPtBr,
            transactions: transactionsPtBr,
         },
      },
   },
};

export default resources;
