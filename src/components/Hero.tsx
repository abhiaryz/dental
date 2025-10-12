import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-dental-clinic.jpg";

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 128, 96, 0.92), rgba(0, 128, 96, 0.85)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Your Smile, Our Priority
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
            Experience exceptional dental care in a comfortable, modern environment. 
            We're committed to making every visit pleasant and stress-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="cta" 
              size="lg"
              onClick={scrollToContact}
              className="text-lg h-14 px-8"
            >
              Book Your Appointment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg h-14 px-8 bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground backdrop-blur"
              onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            >
              Our Services
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
