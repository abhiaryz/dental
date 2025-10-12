import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">S</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary leading-tight">Shivaji Health</h3>
                <p className="text-xs text-muted-foreground leading-tight">& Dental Care</p>
              </div>
            </div>
            <p className="text-foreground mb-4 max-w-md">
              Your trusted partner in dental health. We're committed to providing exceptional care 
              in a comfortable, welcoming environment.
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Made with <Heart className="w-4 h-4 text-accent fill-accent" /> for our patients
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Our Team
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Testimonials
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary mb-4">Contact Info</h4>
            <ul className="space-y-2 text-foreground">
              <li>123 Healthcare Blvd</li>
              <li>City, State 12345</li>
              <li className="pt-2">
                <a href="tel:+1234567890" className="hover:text-accent transition-colors">
                  (123) 456-7890
                </a>
              </li>
              <li>
                <a href="mailto:info@shivajidental.com" className="hover:text-accent transition-colors">
                  info@shivajidental.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shivaji Health and Dental Care. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
