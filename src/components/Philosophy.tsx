import { Heart, Shield, Star } from "lucide-react";

const Philosophy = () => {
  const values = [
    {
      icon: Heart,
      title: "Patient-Centered Care",
      description: "Your comfort and well-being are at the heart of everything we do. We listen, understand, and tailor our approach to your unique needs.",
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We believe in honest communication and clear treatment plans. You'll always know what to expect, with no surprises.",
    },
    {
      icon: Star,
      title: "Excellence in Dentistry",
      description: "Combining advanced technology with proven techniques, we deliver the highest standard of dental care.",
    },
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Care in Our Name
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            At Shivaji Health and Dental Care, "care" isn't just part of our name—it's our promise to you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div 
                key={index} 
                className="bg-card p-8 rounded-lg shadow-card hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-primary">
                  {value.title}
                </h3>
                <p className="text-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
