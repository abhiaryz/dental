import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useState } from "react";
import AppointmentModal from "@/components/AppointmentModal";

const Contact = () => {
  const [open, setOpen] = useState(false);
  return (
    <section id="contact" className="py-20 bg-secondary relative">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-accent/10 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Visit Us Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're conveniently located and ready to welcome you. Schedule your appointment today.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1">Location</h3>
                <p className="text-foreground"> 
                  Block N, 527/19<br />
                  Saurabh Vihar, Badarpur<br />
                  New Delhi, 110044
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1">Phone</h3>
                <a href="tel:+1234567890" className="text-foreground hover:text-accent transition-colors">
                  9999 354-083
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1">Email</h3>
                <a href="mailto:info@shivajidental.com" className="text-foreground hover:text-accent transition-colors">
                  info@shivajidental.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary mb-1">Hours</h3>
                <div className="text-foreground space-y-1">
                  <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => setOpen(true)} variant="cta" size="lg" className="w-full sm:w-auto shadow-button hover:shadow-lg transition hover:-translate-y-0.5">
                Schedule Appointment
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg overflow-hidden shadow-card h-[400px] border border-border/60">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.0367408834923!2d77.3189426!3d28.5085423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce7a92e09584d%3A0x7dd67f0bdf2dd443!2sshivaji%20health%20and%20dental%20care!5e0!3m2!1sen!2sin!4v1760295852261!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Shivaji Health and Dental Care Location"
            ></iframe>
          
          </div>
        </div>
      </div>
      <AppointmentModal open={open} onOpenChange={setOpen} />
    </section>
  );
};

export default Contact;
