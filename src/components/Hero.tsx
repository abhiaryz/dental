import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import AppointmentModal from "@/components/AppointmentModal";
import heroImage from "@/assets/hero-dental-clinic.jpg";

const Hero = () => {
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };
  const [open, setOpen] = useState(false);

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
      {/* subtle vignette and pattern overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
      <div className="absolute inset-0 -z-0 opacity-[0.07]" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px), radial-gradient(circle at 40% 80%, white 1px, transparent 1px)`, backgroundSize: '120px 120px' }} />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight drop-shadow">
            Your Smile, Our Priority
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 leading-relaxed">
            Experience exceptional dental care in a comfortable, modern environment. 
            We're committed to making every visit pleasant and stress-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="cta" 
              size="lg"
              onClick={() => setOpen(true)}
              className="text-lg h-14 px-8 shadow-button hover:shadow-lg hover:-translate-y-0.5 transition will-change-transform"
            >
              Book Your Appointment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="text-lg h-14 px-8 bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20 hover:text-primary-foreground backdrop-blur hover:-translate-y-0.5 transition"
              onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            >
              Our Services
            </Button>
          </div>
        </div>
      </div>
      <AppointmentModal open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default Hero;
