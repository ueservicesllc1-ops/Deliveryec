import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CategoriesSection from '@/components/CategoriesSection';
import RestaurantsSection from '@/components/RestaurantsSection';
import HowItWorks from '@/components/HowItWorks';
import OffersSection from '@/components/OffersSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import AppDownloadSection from '@/components/AppDownloadSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <CategoriesSection />
      <RestaurantsSection />
      <HowItWorks />
      <OffersSection />
      <TestimonialsSection />
      <AppDownloadSection />
      <Footer />
    </main>
  );
}
