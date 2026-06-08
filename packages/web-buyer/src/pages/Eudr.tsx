import { useTranslation } from "react-i18next";
import { LegalPageLayout } from "../components/LegalPageLayout";
import { EUDR_PAGE } from "../data/eudr-content";

export default function Eudr() {
  const { i18n } = useTranslation();
  const data = EUDR_PAGE[i18n.language === "fr" ? "fr" : "en"];
  return <LegalPageLayout data={data} />;
}
