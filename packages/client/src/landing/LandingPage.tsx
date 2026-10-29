import UtilityBar from "./components/UtilityBar";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProblemsSection from "./components/ProblemsSection";
import MethodologySection from "./components/MethodologySection";
import ServicesSection from "./components/ServicesSection";
import CaseStudiesSection from "./components/CaseStudiesSection";
import DecisionSection from "./components/DecisionSection";
import ValueSection from "./components/ValueSection";
import AboutSection from "./components/AboutSection";
import Footer from "./components/Footer";

export default function LandingPage() {
  return (
    <div className="site">
      <UtilityBar />
      <Navbar />
      <main>
        <Hero />
        <ProblemsSection />
        <MethodologySection />
        <ServicesSection />
        <CaseStudiesSection />
        <DecisionSection />
        <ValueSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
