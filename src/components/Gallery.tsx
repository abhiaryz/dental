import hero from "@/assets/hero-dental-clinic.jpg";
import team1 from "@/assets/team-dentist-1.jpg";
import team2 from "@/assets/team-hygienist.jpg";
import team3 from "@/assets/team-assistant.jpg";

const images = [
  { src: hero, alt: "Clinic reception" },
  { src: team1, alt: "Lead dentist at work" },
  { src: team2, alt: "Hygienist preparing tools" },
  { src: team3, alt: "Assistant supporting patient" },
  { src: hero, alt: "Modern treatment room" },
  { src: team1, alt: "Consultation area" },
  { src: team2, alt: "Sterilization station" },
  { src: team3, alt: "Waiting lounge" },
];

const Gallery = () => {
  return (
    <section id="gallery" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A glimpse into our clinic, facilities, and caring team.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg shadow-card border border-border/60">
              <img src={img.src} alt={img.alt} className="w-full h-48 md:h-56 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-primary-foreground/90 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 to-transparent">
                {img.alt}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;


