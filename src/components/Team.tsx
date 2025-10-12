import dentistImage from "@/assets/team-dentist-1.jpg";
import hygienistImage from "@/assets/team-hygienist.jpg";
import assistantImage from "@/assets/team-assistant.jpg";

const Team = () => {
  const teamMembers = [
    {
      name: "Dr. Rajesh Shivaji",
      role: "Lead Dentist & Founder",
      image: dentistImage,
      bio: "With over 15 years of experience, Dr. Shivaji is dedicated to providing compassionate, patient-centered care using the latest dental technologies.",
    },
    {
      name: "Sarah Williams",
      role: "Dental Hygienist",
      image: hygienistImage,
      bio: "Sarah specializes in preventive care and patient education, ensuring every visit leaves you with a healthier, brighter smile.",
    },
    {
      name: "Michael Chen",
      role: "Dental Assistant",
      image: assistantImage,
      bio: "Michael's friendly demeanor and attention to detail make every patient feel comfortable and well-cared for during their visit.",
    },
  ];

  return (
    <section id="team" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Our Expert Team
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our experienced professionals are dedicated to making your dental experience exceptional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className="bg-card rounded-lg overflow-hidden shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-1 text-primary">
                  {member.name}
                </h3>
                <p className="text-accent font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-foreground leading-relaxed">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
