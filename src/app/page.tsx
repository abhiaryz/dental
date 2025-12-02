"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  HeartPulse,
  MapPin,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Star,
  Users
} from "lucide-react";
import { useState } from "react";

const trustBadges = [
  { icon: ShieldCheck, label: "NABH-friendly workflows" },
  { icon: MapPin, label: "Data hosted in India" },
  { icon: MessageSquare, label: "Support in English & Hindi" }
];

const metrics = [
  { value: "500+", label: "Clinics onboarded" },
  { value: "50K+", label: "Patient records managed" },
  { value: "60%", label: "Administrative hours saved" },
  { value: "24/7", label: "Specialist support" }
];

const coreFeatures = [
  {
    icon: Users,
    title: "Patient experience",
    description:
      "Keep every patient updated with simple reminders, online forms, and visit history in one place.",
    bullets: [
      "WhatsApp and SMS reminders for Indian time zones",
      "Digital intake forms in English and Hindi",
      "Clinic-branded portal for bills and prescriptions"
    ]
  },
  {
    icon: CalendarClock,
    title: "Easy scheduling",
    description:
      "View chair availability, confirm appointments fast, and avoid last-minute gaps.",
    bullets: [
      "Colour-coded calendar for every doctor",
      "One-click reschedule and waitlist alerts",
      "Daily agenda shared with the front desk"
    ]
  },
  {
    icon: BarChart3,
    title: "Clinic insights",
    description:
      "Track revenue, expenses, and treatment trends without spreadsheets.",
    bullets: [
      "Simple dashboards for collections and dues",
      "Insurance claim tracking specific to India",
      "Download-ready MIS reports for partners"
    ]
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "Share clinic data",
    description: "Our team imports your patients, treatments, and rate cards in 3-5 working days."
  },
  {
    step: "02",
    title: "Setup reminders",
    description: "Configure WhatsApp templates, follow-up rules, and doctor slots to match your routine."
  },
  {
    step: "03",
    title: "Train your staff",
    description: "Front desk and doctors learn the basics with quick Hindi/English video walk-throughs."
  },
  {
    step: "04",
    title: "Go live",
    description: "Start using MediCare with on-call support and regular health checks from our success team."
  }
];

const carePrograms = [
  {
    title: "Clinic owners",
    description:
      "See daily collections, chair usage, and branch wise numbers on one simple screen.",
    highlight: "Share reports with partners in a click."
  },
  {
    title: "Practice managers",
    description:
      "Plan doctor shifts, track pending tasks, and close the day without spreadsheets.",
    highlight: "Clear checklist for reception, billing, and pharmacy."
  },
  {
    title: "Front desk team",
    description:
      "Schedule, collect payments, and remind patients from the same panel.",
    highlight: "Automated reminders reduce follow-up calls."
  }
];

const testimonials = [
  {
    name: "Dr. Kavita Desai",
    role: "Ahmedabad",
    quote:
      "MediCare keeps my reception team relaxed. Patients get reminders on time and billing is crystal clear.",
    metric: "+35% recall visits"
  },
  {
    name: "Amit Malhotra",
    role: "Operations Head, Pune",
    quote:
      "Daily WhatsApp summary gives me collections and doctor hours before 8 AM. No more manual reports.",
    metric: "12 hrs saved each week"
  },
  {
    name: "Dr. Priya Sharma",
    role: "Gurugram",
    quote:
      "Even our senior doctors find the interface simple. Training finished in one afternoon.",
    metric: "100% staff adoption"
  }
];

const pricingPlans = [
  {
    name: "Monthly plan",
    price: 2999,
    description: "One subscription for individual doctors and multi-chair clinics alike.",
    features: [
      "Unlimited doctors, assistants, and support staff",
      "Comprehensive patient records with e-prescriptions",
      "WhatsApp & SMS reminders with Indian templates",
      "Chair and appointment calendar with waitlist",
      "Inventory, billing, and TPA claim tracking",
      "Dedicated onboarding + WhatsApp support"
    ]
  }
];

const faqs = [
  {
    question: "How much time does setup take?",
    answer:
      "Single clinics go live within 3-5 working days. Our team imports your data and trains your staff."
  },
  {
    question: "Does MediCare work with my current tools?",
    answer:
      "Yes. We connect with popular PMS, WhatsApp Business, SMS, payment gateways, and TPA partners."
  },
  {
    question: "Where is my data stored?",
    answer:
      "All patient data stays in secure Indian data centres with daily backups and audit logs."
  },
  {
    question: "Can we customise reminders and forms?",
    answer:
      "You can edit every template, choose preferred language, and set timing rules as per your clinic."
  },
  {
    question: "Will you support my team after launch?",
    answer:
      "We provide phone, WhatsApp, and email support plus refresher training whenever needed."
  }
];

const contactHighlights = [
  {
    title: "Talk to our team",
    description: "Fix a quick call to understand if MediCare fits your clinic.",
    icon: Activity
  },
  {
    title: "Watch a product walk-through",
    description: "Join a short Zoom session to explore the main features step by step.",
    icon: CalendarClock
  },
  {
    title: "Plan your rollout",
    description: "Get a step-by-step checklist for staff training and go-live.",
    icon: MessageSquare
  }
];

const heroGallery = [
  {
    title: "Evening OPD in Bengaluru",
    subtitle: "Four-chair clinic using MediCare for daily reporting",
    image:
      "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=1200&h=800&fit=crop&q=80"
  },
  {
    title: "Sterilisation check",
    subtitle: "Assistant marks tasks complete on the mobile app",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=600&fit=crop&q=80"
  },
  {
    title: "Community camp in Pune",
    subtitle: "Patient records captured digitally on-site",
    image:
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800&h=600&fit=crop&q=80"
  }
];

const clinicStories = [
  {
    title: "Modern chair-side experience",
    location: "Delhi NCR",
    image:
      "https://images.unsplash.com/photo-1520012218364-4f42010c0c05?w=800&h=600&fit=crop&q=80",
    caption: "Doctors review treatment plans with patients in seconds."
  },
  {
    title: "Friendly reception",
    location: "Hyderabad",
    image:
      "https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?w=800&h=600&fit=crop&q=80",
    caption: "Front desk schedules visits and collects payments on one screen."
  },
  {
    title: "Kids dental care",
    location: "Chennai",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80",
    caption: "Reminders keep parents updated for every follow-up visit."
  }
];

const rbacRoles = [
  {
    title: "Admin",
    description: "Clinic owner or partner with complete access to billing, settings, and reports."
  },
  {
    title: "Clinic Doctor",
    description: "Manage treatments, prescriptions, clinical notes, and patient communication."
  },
  {
    title: "Hygienist (read)",
    description: "View treatment history and add clinical observations without editing billing."
  },
  {
    title: "Receptionist",
    description: "Handle appointments, payments, and patient onboarding with guided workflows."
  },
  {
    title: "External Doctor",
    description: "Limited guest access for visiting specialists with case-specific permissions."
  }
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-slate-50 text-slate-900">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>

      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-white to-emerald-200/40" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-64 -left-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

        <nav className="relative z-20 border-b border-white/60 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-emerald-500 text-white shadow-lg">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="text-xl font-semibold tracking-tight text-slate-900">MediCare</span>
            </Link>

            <div className="flex items-center gap-3">
               <Link href="/login">
                 <Button variant="ghost" className="font-medium text-slate-700 hover:text-slate-900">
                   Log in
                 </Button>
               </Link>
              <Link href="/doctors">
                <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-100">
                  Find doctors
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-sky-600 to-emerald-500 px-6 font-semibold text-white shadow-lg hover:from-sky-600/90 hover:to-emerald-500/90">
                  Sign up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-24 lg:pt-32">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Built for Indian dental clinics
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Run your dental clinic smoothly across India.
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">
                  MediCare keeps appointments, patient history, billing, and reminders together so your team can focus on quality treatment. Send updates on WhatsApp, track payments, and stay compliant without extra effort.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="h-14 rounded-2xl bg-slate-900 px-8 text-lg font-semibold text-white shadow-xl hover:bg-slate-800">
                    Sign up now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/doctors">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-2xl border-slate-200 px-8 text-lg font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Find doctors near you
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {trustBadges.map((badge, index) => (
                  <div key={badge.label} className="flex items-center gap-2 text-sm text-slate-600">
                    <badge.icon className="h-5 w-5 text-emerald-500" />
                    <span>{badge.label}</span>
                    {index < trustBadges.length - 1 && <span className="text-slate-300">•</span>}
                  </div>
                ))}
              </div>

              <div className="grid gap-6 rounded-3xl border border-white bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:grid-cols-2">
                <div>
                  <p className="text-4xl font-semibold text-slate-900">4.9 / 5</p>
                  <p className="text-sm text-slate-500">
                    Average rating from clinic directors and practice managers.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Personalized onboarding for every location
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Data residency options for global teams
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Dedicated support with <span className="font-semibold text-slate-700">5 min</span> median response
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:pl-6">
              {heroGallery.map((item, index) => (
                <div
                  key={item.title}
                  className={`group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-xl backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-2xl ${
                    index === 0 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div className="relative h-72 w-full lg:h-64">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                      Clinic spotlight
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 space-y-1 text-white">
                      <p className="text-lg font-semibold drop-shadow-sm">{item.title}</p>
                      <p className="text-sm text-white/80">{item.subtitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl">
              <div className="grid gap-10 p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
                <div className="space-y-6">
                  <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                    Trusted by forward-thinking dental networks.
                  </h2>
                  <p className="text-lg leading-relaxed text-slate-600">
                    MediCare centralizes your operations, finances, and patient experience so every team can focus on clinical excellence. Real-time dashboards keep leadership aligned while automations reduce manual tasks across the practice.
                  </p>
                  <div className="flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      HIPAA-ready infrastructure & audit trails
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      Role-based access for every department
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 text-center shadow-sm">
                      <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                      <p className="mt-2 text-sm text-slate-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-x-0 top-1/2 h-full -translate-y-1/2 bg-gradient-to-b from-transparent via-sky-100/60 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Platform pillars</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Designed for high-trust patient care
                </h2>
              </div>
              <p className="max-w-xl text-base text-slate-600">
                We combined world-class patient experience tooling, deep operational analytics, and intelligent automations in a single, beautiful workspace.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              {coreFeatures.map((feature) => (
                <Card key={feature.title} className="relative h-full border-slate-100 shadow-lg shadow-sky-100/40">
                  <CardHeader className="space-y-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl text-slate-900">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
                        <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 rounded-3xl border border-slate-100 bg-white/90 p-10 shadow-xl lg:grid-cols-[0.95fr_1.05fr] lg:p-16">
              <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Implementation pathway</p>
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  The MediCare rollout blueprint
                </h2>
                <p className="text-lg leading-relaxed text-slate-600">
                  Whether you operate a single clinic or a nationwide network, MediCare guides your team through a proven change management framework that minimizes disruption and maximizes adoption.
                </p>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">What to expect</p>
                  <p className="mt-3 text-sm text-emerald-800">
                    Dedicated onboarding staff, role-based training paths, and success checkpoints keep every location aligned.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-5 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-base font-semibold text-white">
                      {step.step}
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900">{step.title}</p>
                      <p className="text-sm text-slate-600">{step.description}</p>
                      {index < workflowSteps.length - 1 && <div className="h-px w-full bg-gradient-to-r from-slate-200 via-transparent to-transparent" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Purpose-built for every role</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Align clinical, operational, and patient-facing teams
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                MediCare provides the tooling each team needs without sacrificing collaboration or compliance. Everyone works from the same source of truth.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {carePrograms.map((program) => (
                <div key={program.title} className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-lg shadow-slate-200/70">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-slate-900">{program.title}</h3>
                    <p className="text-base text-slate-600">{program.description}</p>
                  </div>
                  <div className="mt-8 rounded-2xl bg-gradient-to-r from-sky-500/10 to-emerald-500/10 p-5 text-sm font-medium text-slate-700">
                    {program.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Proof in practice</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Clinics that lead with compassion and data choose MediCare
                </h2>
              </div>
              <p className="max-w-xl text-base text-slate-600">
                Hear how ambitious dental teams reinvented operational efficiency and patient delight after switching to MediCare.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="flex h-full flex-col border-slate-100 bg-white/95 shadow-xl shadow-slate-200/80">
                  <CardContent className="relative flex flex-1 flex-col gap-6 pt-8">
                    <Star className="h-10 w-10 text-emerald-500" />
                    <p className="text-base leading-relaxed text-slate-700">“{testimonial.quote}”</p>
                    <div className="mt-auto space-y-1">
                      <p className="text-lg font-semibold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.role}</p>
                      <p className="text-xs font-semibold text-emerald-600">{testimonial.metric}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col gap-6 text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Pricing that grows with your practice
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">One plan. Everything included.</h2>
                <p className="mx-auto max-w-2xl text-base text-slate-600">
                  A single monthly subscription unlocks MediCare for individual doctors, growing clinics, and multi-branch networks. No feature tiers or hidden add-ons.
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className="border-slate-200 bg-white/95 shadow-xl">
                  <CardHeader className="space-y-4 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold text-slate-700">
                      Monthly billing
                    </div>
                    <CardTitle className="text-2xl text-slate-900">{plan.name}</CardTitle>
                    <CardDescription className="text-base text-slate-600">{plan.description}</CardDescription>
                    <div>
                      <span className="text-4xl font-semibold text-slate-900">₹{plan.price.toLocaleString()}</span>
                      <span className="text-sm text-slate-500"> / month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6 text-left">
                    <ul className="space-y-3 text-sm text-slate-600">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" className="block">
                      <Button className="w-full rounded-xl bg-slate-900 text-white shadow-lg hover:bg-slate-800">
                        Sign up for MediCare
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Role-based access</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Permissions designed for Indian dental teams
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                Define responsibilities clearly for every member of your clinic. MediCare ensures each role sees only what they need while keeping patient data secure.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rbacRoles.map((role) => (
                <Card key={role.title} className="border-slate-200 bg-white/90 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{role.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-10 text-white shadow-xl lg:grid-cols-[1fr_1fr] lg:p-16">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  <Sparkles className="h-4 w-4" /> White-glove consultations
                </div>
                <h2 className="text-3xl font-semibold sm:text-4xl">Ready to craft your future-ready practice?</h2>
                <p className="text-base text-slate-200">
                  Partner with MediCare specialists to audit your current workflows, map opportunities, and design a launch plan that respects your clinicians' time and your patients' trust.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/signup">
                    <Button className="h-12 rounded-xl bg-white px-6 font-semibold text-slate-900 hover:bg-slate-200">
                      Schedule strategy session
                    </Button>
                  </Link>
                  <Link href="mailto:hello@medicare.health" className="text-sm font-semibold text-emerald-200 hover:text-emerald-100">
                    hello@medicare.health
                  </Link>
                </div>
              </div>
              <div className="grid gap-4">
                {contactHighlights.map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-white/20 bg-white/10 p-5">
                    <div className="rounded-xl bg-white/20 p-3">
                      <item.icon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-slate-200">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Inside Indian clinics</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Real moments captured while running MediCare
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
                Clinics across the country use MediCare to stay organised, create warm patient experiences, and grow predictably.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {clinicStories.map((story) => (
                <div
                  key={story.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-xl backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-64 w-full">
                    <img
                      src={story.image}
                      alt={`${story.title} - ${story.location}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                      {story.location}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 space-y-1 text-white">
                      <p className="text-lg font-semibold drop-shadow-sm">{story.title}</p>
                      <p className="text-sm text-white/80">{story.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-200/80 bg-white/90">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.4fr_repeat(3,0.8fr)]">
            <div className="space-y-5">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-emerald-500 text-white shadow-lg">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <span className="text-xl font-semibold text-slate-900">MediCare</span>
              </Link>
              <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                MediCare is the operating system for modern dental practices—bridging patient experience, operational rigor, and financial clarity in one secure platform.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" /> HIPAA-ready
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> SOC 2-aligned controls
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Continuous innovation
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Platform</p>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <Link href="#pricing" className="hover:text-slate-900">Plans & pricing</Link>
                <Link href="#" className="hover:text-slate-900">Product overview</Link>
                <Link href="#" className="hover:text-slate-900">Automation library</Link>
                <Link href="#" className="hover:text-slate-900">Security</Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Company</p>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <Link href="#" className="hover:text-slate-900">About</Link>
                <Link href="#" className="hover:text-slate-900">Careers</Link>
                <Link href="#" className="hover:text-slate-900">Partners</Link>
                <Link href="#" className="hover:text-slate-900">Media</Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Connect</p>
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <Link href="mailto:hello@medicare.health" className="hover:text-slate-900">hello@medicare.health</Link>
                <Link href="tel:+18005551234" className="hover:text-slate-900">+1 (800) 555-1234</Link>
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-1 h-4 w-4 text-slate-500" />
                  <span>123 Healthcare Plaza, Suite 400, San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} MediCare. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="#" className="hover:text-slate-700">Privacy Policy</Link>
              <span>•</span>
              <Link href="#" className="hover:text-slate-700">Terms of Service</Link>
              <span>•</span>
              <Link href="#" className="hover:text-slate-700">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
