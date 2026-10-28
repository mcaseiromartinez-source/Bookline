import { Comparison } from "@/components/Comparison";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { Problem } from "@/components/Problem";
import { RoiCalculator } from "@/components/RoiCalculator";
import { Verticals } from "@/components/Verticals";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Verticals />
        <RoiCalculator />
        <Comparison />
        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
