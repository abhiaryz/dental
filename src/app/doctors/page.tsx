import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Sparkles, Stethoscope } from "lucide-react";

const doctorGroups = {
  metro: [
    {
      name: "Dr. Kavita Desai",
      clinic: "SmileCare Dental Studio",
      city: "Ahmedabad",
      expertise: "Implants, cosmetic dentistry",
      phone: "+91 98250 11223"
    },
    {
      name: "Dr. Arjun Menon",
      clinic: "City Dental Lounge",
      city: "Bengaluru",
      expertise: "Aligners, oral surgery",
      phone: "+91 98860 33445"
    },
    {
      name: "Dr. Neha Bhatia",
      clinic: "White Pearl Dental",
      city: "Delhi NCR",
      expertise: "Pediatric dentistry, preventive care",
      phone: "+91 98990 55667"
    }
  ],
  tier2: [
    {
      name: "Dr. Sachin Patil",
      clinic: "Healthy Smiles",
      city: "Nashik",
      expertise: "Root canal, prosthodontics",
      phone: "+91 98231 22990"
    },
    {
      name: "Dr. Rima Dutta",
      clinic: "CarePlus Dental",
      city: "Guwahati",
      expertise: "Oral medicine, cosmetic fillings",
      phone: "+91 98540 22661"
    },
    {
      name: "Dr. Harshil Shah",
      clinic: "Bright Dental Care",
      city: "Rajkot",
      expertise: "General dentistry, preventive camps",
      phone: "+91 98980 44556"
    }
  ]
} as const;

export default function DoctorsPage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-16 space-y-10">
        <header className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-4 py-1 text-sm font-medium text-sky-700 shadow-sm">
            <Stethoscope className="h-4 w-4" />
            Find DentaEdge doctors
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Doctors using DentaEdge across India</h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Search by city or browse the list below to connect with experienced dentists already managing their clinics on DentaEdge.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by doctor name or city"
              className="h-12 rounded-xl border-slate-200 bg-white/90"
            />
            <Button className="h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800">Search</Button>
          </div>
        </header>

        <Tabs defaultValue="metro" className="space-y-6">
          <TabsList className="w-full justify-start gap-2 rounded-2xl bg-white/80 p-2 shadow">
            <TabsTrigger
              value="metro"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
            >
              Metro cities
            </TabsTrigger>
            <TabsTrigger
              value="tier2"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white"
            >
              Tier 2 & 3 cities
            </TabsTrigger>
          </TabsList>

          {Object.entries(doctorGroups).map(([key, doctors]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {doctors.map((doctor) => (
                  <Card key={doctor.phone} className="border-slate-200 bg-white/90 shadow-lg">
                    <CardHeader className="space-y-2">
                      <CardTitle className="text-xl text-slate-900">{doctor.name}</CardTitle>
                      <CardDescription className="text-sm text-slate-600">
                        {doctor.clinic}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-sky-600" />
                        <span>{doctor.city}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span>{doctor.expertise}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{doctor.phone}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="border-slate-200 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Want your clinic listed here?</CardTitle>
            <CardDescription className="text-slate-600">
              Sign up for DentaEdge and we will help you publish your clinic details across our referral network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">Sign up your clinic</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
