import { Star } from "lucide-react";
import emilyImage from "@/assets/testimonial-emily.jpg";
import jamesImage from "@/assets/testimonial-james.jpg";
import priyaImage from "@/assets/testimonial-priya.jpg";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Emily Rodriguez",
      image: emilyImage,
      text: "I've always been anxious about dental visits, but the team at Shivaji made me feel so comfortable. They truly care about their patients!",
      rating: 5,
    },
    {
      name: "James Peterson",
      image: jamesImage,
      text: "Professional, friendly, and efficient. The best dental experience I've ever had. Highly recommend for anyone looking for quality care.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      image: priyaImage,
      text: "From the moment I walked in, I felt welcomed. The modern facility and caring staff make all the difference. My smile has never looked better!",
      rating: 5,
    },
    {
      name: "Robert Miller",
      image: jamesImage,
      text: "Outstanding service from start to finish. The hair transplant procedure was painless and the results are amazing!",
      rating: 5,
    },
    {
      name: "Lisa Anderson",
      image: emilyImage,
      text: "The PRP treatment has done wonders for my skin. I look years younger and feel more confident than ever!",
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

        <div className="relative max-w-6xl mx-auto overflow-hidden">
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-secondary p-8 rounded-lg shadow-card hover:shadow-lg transition-shadow flex-shrink-0 w-[350px] snap-center"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-primary mb-1">
                      {testimonial.name}
                    </p>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-foreground leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
