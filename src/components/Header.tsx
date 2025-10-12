import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary leading-tight">Shivaji Health</h2>
            <p className="text-xs text-muted-foreground leading-tight">& Dental Care</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => scrollToSection("services")}
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Services
          </button>
          <button 
            onClick={() => scrollToSection("team")}
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Our Team
          </button>
          <button 
            onClick={() => scrollToSection("testimonials")}
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Testimonials
          </button>
          <button 
            onClick={() => scrollToSection("contact")}
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a href="tel:+1234567890" className="hidden sm:flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            <span className="font-medium">(123) 456-7890</span>
          </a>
          <Button variant="cta" onClick={() => scrollToSection("contact")}>
            Book Appointment
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
