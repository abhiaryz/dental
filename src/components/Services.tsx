import { Smile, Sparkles, AlertCircle, Stethoscope } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Smile,
      title: "General Dentistry",
      description: "Comprehensive oral health care including cleanings, fillings, and preventive treatments to keep your smile healthy.",
      items: ["Regular Checkups", "Teeth Cleaning", "Fillings & Repairs", "Oral Health Assessments"],
    },
    {
      icon: Sparkles,
      title: "Cosmetic Dentistry",
      description: "Transform your smile with our aesthetic treatments designed to boost your confidence.",
      items: ["Teeth Whitening", "Veneers", "Bonding", "Smile Makeovers"],
    },
    {
      icon: AlertCircle,
      title: "Emergency Care",
      description: "Immediate attention when you need it most. We're here to help with dental emergencies.",
      items: ["Same-Day Appointments", "Pain Relief", "Urgent Repairs", "24/7 Support Line"],
    },
    {
      icon: Stethoscope,
      title: "Specialized Treatments",
      description: "Advanced procedures performed with precision and care for complex dental needs.",
      items: ["Root Canals", "Extractions", "Crowns & Bridges", "Dental Implants"],
    },
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Comprehensive Dental Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From routine care to complex procedures, we offer a full range of dental services to meet all your oral health needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div 
                key={index} 
                className="bg-card p-6 rounded-lg shadow-card hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-primary">
                  {service.title}
                </h3>
                <p className="text-foreground mb-4 text-sm leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
