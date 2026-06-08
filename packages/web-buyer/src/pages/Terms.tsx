import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "../components/LegalPageLayout";
import { TERMS } from "../data/terms-content";

export default function Terms() {
  const { i18n } = useTranslation();
  const data = TERMS[i18n.language === "fr" ? "fr" : "en"];
  return <LegalPageLayout data={data} />;
}
