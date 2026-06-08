import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "../components/LegalPageLayout";
import { LEGAL } from "../data/legal-content";

export default function Legal() {
  const { i18n } = useTranslation();
  const data = LEGAL[i18n.language === "fr" ? "fr" : "en"];
  return <LegalPageLayout data={data} />;
}
