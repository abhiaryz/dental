import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
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
            className="text-foreground hover:text-primary transition-colors font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            Services
          </button>
          <button 
            onClick={() => scrollToSection("team")}
            className="text-foreground hover:text-primary transition-colors font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            Our Team
          </button>
          <button 
            onClick={() => scrollToSection("testimonials")}
            className="text-foreground hover:text-primary transition-colors font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            Testimonials
          </button>
          <button 
            onClick={() => scrollToSection("contact")}
            className="text-foreground hover:text-primary transition-colors font-medium relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a href="tel:+1234567890" className="hidden sm:flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            <span className="font-medium">9999 354-083</span>
          </a>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="cta" size="sm" className="shadow-button hover:shadow-lg transition hover:-translate-y-0.5">
              Sign Up
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
