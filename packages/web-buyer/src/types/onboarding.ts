import type { ThemeColors } from "../context/ThemeContext";

export type UserType = "potential_buyer" | "active_buyer" | "farmer" | "other";
export type CompanySize = "1-10" | "11-50" | "51-200" | "200+";
export type ContactPreference = "email" | "phone" | "whatsapp";

export interface OnboardingData {
  userType: UserType;
  hasCompany: boolean;
  companyName: string;
  companySize: CompanySize | "";
  companySector: string;
  ifu: string;
  productsOfInterest: string[];
  regionsOfInterest: string[];
  estimatedMonthlyVolume: string;
  phone: string;
  contactPreference: ContactPreference;
  acceptNewsletter: boolean;
  acceptTerms: boolean;
  completed: boolean;
}

export interface StepValidation {
  valid: boolean;
  messageKey?: string;
}

export type StepValidator = (data: OnboardingData) => StepValidation;

export interface StepProps {
  data: OnboardingData;
  save: (partial: Partial<OnboardingData>) => Promise<void>;
  t: (key: string, options?: Record<string, string | number>) => string;
  colors: ThemeColors;
  isDark: boolean;
}

export const DEFAULT_ONBOARDING: OnboardingData = {
  userType: "potential_buyer",
  hasCompany: false,
  companyName: "",
  companySize: "",
  companySector: "",
  ifu: "",
  productsOfInterest: [],
  regionsOfInterest: [],
  estimatedMonthlyVolume: "",
  phone: "",
  contactPreference: "email",
  acceptNewsletter: true,
  acceptTerms: true,
  completed: false,
};

export const PRODUCT_OPTIONS = [
  "cacao", "coton", "anacarde", "cafe", "mais",
  "soja", "manioc", "riz", "sesame", "fruits",
  "legumes", "huile_palme", "autres",
] as const;

export const REGION_OPTIONS = [
  "atlantique", "borgou", "collines", "couffo",
  "dongas", "littoral", "mono", "oueme",
  "plateau", "zou",
] as const;

export const STEP_VALIDATORS: StepValidator[] = [
  (d) => ({ valid: !!d.userType, messageKey: d.userType ? undefined : "onboarding.wizard.errorUserType" }),
  (d) => ({ valid: !d.hasCompany || !!d.companyName.trim(), messageKey: d.hasCompany && !d.companyName.trim() ? "onboarding.wizard.errorCompanyName" : undefined }),
  (d) => ({ valid: d.productsOfInterest.length > 0 || d.regionsOfInterest.length > 0, messageKey: "onboarding.wizard.errorInterests" }),
  (d) => ({ valid: !!d.phone.trim(), messageKey: d.phone.trim() ? undefined : "onboarding.wizard.errorPhone" }),
];
