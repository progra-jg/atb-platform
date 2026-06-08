import { useCallback, useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import SEO from "../components/SEO";
import Footer from "../components/Footer";
import { CookieConsent, SkipToContent, SectionErrorBoundary } from "../components/CookieConsent";
import ScrollProgressBar from "../components/landing/ScrollProgressBar";
import NavBar from "../components/landing/NavBar";
import MobileMenu from "../components/landing/MobileMenu";
import HeroSection from "../components/landing/HeroSection";
import ProducerCTASection from "../components/landing/ProducerCTASection";
import StatsSection from "../components/landing/StatsSection";
import LogoCloudSection from "../components/landing/LogoCloudSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PreviewSection from "../components/landing/PreviewSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import TrustBadgesSection from "../components/landing/TrustBadgesSection";
import NewsletterSection from "../components/landing/NewsletterSection";
import SectionSkeleton, {
  HeroSkeleton, FeaturesSkeleton, StatsSkeleton,
  TestimonialsSkeleton, PricingSkeleton, ComparisonSkeleton,
} from "../components/landing/SectionSkeleton";

const CaseStudies = lazy(() => import("./sections/CaseStudies"));
const FAQ = lazy(() => import("./sections/FAQ"));
const ComparisonGrid = lazy(() => import("./sections/ComparisonGrid"));
const PricingCards = lazy(() => import("./sections/PricingCards"));

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { colors, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [scrollY, setScrollY] = useState(0);
  const [navSolid, setNavSolid] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) { navigate("/dashboard", { replace: true }); return; }
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          setNavSolid(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [user, navigate]);

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) setMobileMenuOpen(false);
  }, [isMobile, mobileMenuOpen]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const reviews = [...Array(9)].map((_, i) => {
    const prefix = `landing.testimonials.t${i + 1}`;
    return { author: t(`${prefix}.author`), reviewBody: t(`${prefix}.quote`), rating: 5 };
  });
  const faqItems = t("landing.faq", { returnObjects: true }) as { q: string; a: string }[];
  const scrollProgress = Math.min(1, scrollY / (document.documentElement.scrollHeight - window.innerHeight));

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", color: colors.text, overflow: "clip" }}>
      <SkipToContent />
      <SEO
        title={t("landing.heroTitle").replace(/\n/g, " ")}
        description={t("landing.heroSubtitle")}
        lang={i18n.language}
        path={window.location.pathname}
        reviews={reviews}
        faq={faqItems}
      />

      <ScrollProgressBar progress={scrollProgress} visible={scrollY > 100} />

      <NavBar
        isMobile={isMobile}
        navSolid={navSolid}
        onScrollTo={scrollTo}
        onLogin={() => navigate("/login")}
        onRegister={() => navigate("/register")}
        onToggleTheme={toggleTheme}
        onToggleMenu={() => setMobileMenuOpen((v) => !v)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onScrollTo={scrollTo}
        onLogin={() => navigate("/login")}
        onRegister={() => navigate("/register")}
      />

      <HeroSection
        scrollY={scrollY}
        onRegister={() => navigate("/register")}
        onExplore={() => navigate("/lots")}
      />

      <ProducerCTASection
        onRegister={() => navigate("/register")}
        onContact={() => navigate("/contact")}
      />

      <StatsSection />

      <LogoCloudSection titleKey="landing.trustedBy" items={["Sofitex", "Cargill", "Olam", "Nestlé", "Louis Dreyfus", "Ecobank"]} />
      <LogoCloudSection titleKey="landing.pressTitle" items={["Bloomberg", "Reuters", "Le Monde", "Jeune Afrique", "Financial Times", "Les Échos"]} />

      <FeaturesSection />

      <PreviewSection />

      <HowItWorksSection />

      <TestimonialsSection />

      <SectionErrorBoundary name="CaseStudies">
        <Suspense fallback={<FeaturesSkeleton />}><CaseStudies colors={colors} /></Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary name="FAQ">
        <Suspense fallback={<TestimonialsSkeleton />}><FAQ colors={colors} /></Suspense>
      </SectionErrorBoundary>
      <SectionErrorBoundary name="ComparisonGrid">
        <Suspense fallback={<ComparisonSkeleton />}><ComparisonGrid colors={colors} /></Suspense>
      </SectionErrorBoundary>

      <TrustBadgesSection onRegister={() => navigate("/register")} />

      <Suspense fallback={<PricingSkeleton />}><PricingCards colors={colors} navigate={navigate} /></Suspense>

      <NewsletterSection />
      <Footer />
      <CookieConsent />
    </div>
  );
}
