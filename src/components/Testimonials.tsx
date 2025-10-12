import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Emily Rodriguez",
      text: "I've always been anxious about dental visits, but the team at Shivaji made me feel so comfortable. They truly care about their patients!",
      rating: 5,
    },
    {
      name: "James Peterson",
      text: "Professional, friendly, and efficient. The best dental experience I've ever had. Highly recommend for anyone looking for quality care.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      text: "From the moment I walked in, I felt welcomed. The modern facility and caring staff make all the difference. My smile has never looked better!",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Our Patients Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it—hear from the people we've had the privilege to serve.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-secondary p-8 rounded-lg shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>
              <p className="font-semibold text-primary">
                — {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
