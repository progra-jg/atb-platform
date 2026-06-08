import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  lang?: string;
  path?: string;
  reviews?: Array<{ author: string; reviewBody: string; rating: number }>;
  faq?: Array<{ q: string; a: string }>;
}

const siteName = "ATB AgriTrace";
const siteUrl = "https://agritrace.bj";
const localeMap: Record<string, string> = { fr: "fr_FR", en: "en_US" };

function orgSchema(lang: string) {
  const desc = lang === "en"
    ? "B2B blockchain agricultural traceability platform — EUDR-certified, GlobalGAP, secure escrow."
    : "Plateforme B2B de traçabilité agricole blockchain — lots certifiés EUDR, GlobalGAP, escrow sécurisé.";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: desc,
    address: { "@type": "PostalAddress", addressCountry: "BJ" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+229-01-XX-XX-XX",
      contactType: "customer service",
      availableLanguage: ["French", "English"],
    },
    sameAs: ["https://linkedin.com/company/agritrace", "https://twitter.com/agritrace"],
  };
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/lots?search={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

function breadcrumbSchema(lang: string) {
  const homeLabel = lang === "en" ? "Home" : "Accueil";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: siteUrl },
    ],
  };
}

export default function SEO({ title, description, ogImage, ogType = "website", lang = "fr", path, reviews, faq }: SEOProps) {
  const locale = localeMap[lang] || "fr_FR";
  const fullTitle = title
    ? `${title} | ${siteName}`
    : lang === "en"
    ? `${siteName} — B2B AgriTech Marketplace`
    : `${siteName} — Place de Marché B2B AgriTech`;
  const desc = description || (lang === "en"
    ? "B2B blockchain agricultural traceability platform — EUDR-certified, GlobalGAP lots. Connect with West African producers."
    : "Plateforme B2B de traçabilité agricole blockchain — lots certifiés EUDR, GlobalGAP. Connectez-vous aux producteurs ouest-africains.");
  const image = ogImage || `${siteUrl}/og-default.jpg`;
  const pagePath = path || window.location.pathname;
  const canonicalUrl = `${siteUrl}${pagePath}?lang=${lang}`;

  const faqSchema = faq?.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  const reviewSchema = reviews?.length ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: reviews.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Review",
        itemReviewed: { "@type": "Organization", name: siteName },
        author: { "@type": "Person", name: r.author },
        reviewBody: r.reviewBody,
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      },
    })),
  } : null;

  return (
    <Helmet>
      <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={lang === "fr" ? "en_US" : "fr_FR"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@agritrace" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="fr" href={`${siteUrl}${pagePath}?lang=fr`} />
      <link rel="alternate" hrefLang="en" href={`${siteUrl}${pagePath}?lang=en`} />
      <link rel="alternate" hrefLang="x-default" href={`${siteUrl}${pagePath}`} />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#0a6e4a" />
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <script type="application/ld+json">{JSON.stringify(orgSchema(lang))}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema(lang))}</script>
      {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      {reviewSchema && <script type="application/ld+json">{JSON.stringify(reviewSchema)}</script>}
    </Helmet>
  );
}
