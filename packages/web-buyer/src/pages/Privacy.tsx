import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "../components/LegalPageLayout";
import { PRIVACY } from "../data/privacy-content";

export default function Privacy() {
  const { i18n } = useTranslation();
  const data = PRIVACY[i18n.language === "fr" ? "fr" : "en"];
  return <LegalPageLayout data={data} />;
}
