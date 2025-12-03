"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  Menu,
  Package,
  Shield,
  Stethoscope,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const stats = [
  { value: "500+", label: "Clinics Onboarded" },
  { value: "50,000+", label: "Patient Records" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

const trustBadges = [
  { icon: Shield, label: "HIPAA Ready" },
  { icon: HeartPulse, label: "NABH Compliant" },
  { icon: Zap, label: "Real-time Sync" },
];

const workflowSteps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Patient Intake",
    description:
      "Digital registration forms, appointment booking, and patient history—all in one place. Reduce paperwork by 80%.",
    features: ["Online booking", "Digital forms", "Medical history"],
  },
  {
    step: "02",
    icon: Stethoscope,
    title: "Clinical Charting",
    description:
      "Complete dental charting with FDI notation. Treatment plans, clinical notes, and X-ray management built for dentists.",
    features: ["FDI tooth chart", "Treatment plans", "Clinical images"],
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Billing & Reports",
    description:
      "Generate invoices, track payments, and export detailed reports. Full visibility into your clinic's financial health.",
    features: ["Auto-invoicing", "Payment tracking", "MIS reports"],
  },
];

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Chair-wise calendar with color-coded appointments. Avoid double-bookings and manage waitlists effortlessly.",
  },
  {
    icon: FileText,
    title: "E-Prescriptions",
    description:
      "Generate prescriptions instantly with your clinic letterhead. Send directly to patients via WhatsApp or email.",
  },
  {
    icon: Package,
    title: "Inventory Management",
    description:
      "Track dental supplies and materials. Get low-stock alerts and maintain optimal inventory levels.",
  },
  {
    icon: Users,
    title: "Multi-Clinic Support",
    description:
      "Manage multiple branches from a single dashboard. Role-based access for doctors, hygienists, and staff.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Real-time insights into revenue, appointments, and patient flow. Make data-driven decisions.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    description:
      "Enterprise-grade security with data encryption. Audit logs and access controls for compliance.",
  },
];

const pricingFeatures = [
  "Unlimited patient records",
  "Appointment scheduling",
  "Dental charting (FDI)",
  "E-prescriptions & treatment plans",
  "Invoice generation with GST",
  "WhatsApp & SMS reminders",
  "Inventory management",
  "Multi-user access (5 staff)",
  "Analytics & reports",
  "Dedicated onboarding support",
  "Regular feature updates",
  "Data backup & security",
];

const footerLinks = {
  platform: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Security", href: "#" },
    { label: "Updates", href: "#" },
  ],
  company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Blog", href: "#" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Data Processing", href: "#" },
  ],
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              DentaEdge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-sm font-medium text-slate-700"
              >
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-teal-600 text-sm font-medium text-white hover:bg-teal-700">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-slate-200" />
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link href="/signup">
                <Button className="mt-2 w-full bg-teal-600 text-white hover:bg-teal-700">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Hero Content */}
              <div className="text-center lg:text-left">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
                  <Shield className="h-4 w-4" />
                  Trusted by 500+ Clinics
                </div>

                <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                  Professional Dental Practice Management
                </h1>

                <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                  The official standard for modern clinics. Streamline
                  operations, enhance patient care, and ensure compliance—all
                  from one powerful dashboard.
                </p>

                <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-14 w-full rounded-xl bg-teal-600 px-8 text-lg font-semibold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 sm:w-auto"
                    >
                      Start for ₹599/mo
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-900"
                  >
                    See how it works
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>

                {/* Trust Badges */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
                  {trustBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className="flex items-center gap-2 text-sm text-slate-500"
                    >
                      <badge.icon className="h-4 w-4 text-teal-600" />
                      <span>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Visual - Dashboard Preview */}
              <div className="relative">
                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">
                  <div className="rounded-xl bg-slate-50 p-4">
                    {/* Mock Dashboard Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-teal-600" />
                        <div className="h-3 w-24 rounded bg-slate-300" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                      </div>
                    </div>

                    {/* Mock Stats Row */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "Patients", value: "1,234" },
                        { label: "Appointments", value: "28" },
                        { label: "Revenue", value: "₹4.2L" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <p className="text-xs text-slate-500">{stat.label}</p>
                          <p className="text-lg font-bold text-slate-900">
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Mock Calendar/List */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-xs font-medium text-slate-500">
                        Today&apos;s Appointments
                      </p>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                        >
                          <div className="h-8 w-8 rounded-full bg-teal-100" />
                          <div className="flex-1">
                            <div className="h-2.5 w-24 rounded bg-slate-300" />
                            <div className="mt-1 h-2 w-16 rounded bg-slate-200" />
                          </div>
                          <div className="h-6 w-16 rounded bg-teal-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -right-4 -top-4 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-lg lg:block">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        Appointment Booked
                      </p>
                      <p className="text-xs text-slate-500">Just now</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-lg lg:block">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
                      <CreditCard className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        Payment Received
                      </p>
                      <p className="text-xs text-slate-500">₹2,500</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
                How it Works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                From Patient Intake to Billing
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                A streamlined workflow designed for dental professionals. Manage
                your entire practice in three simple steps.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="relative">
                  {/* Connector Line (hidden on mobile) */}
                  {index < workflowSteps.length - 1 && (
                    <div className="absolute right-0 top-12 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-teal-200 to-transparent md:block" />
                  )}

                  <Card className="relative h-full border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white">
                          <step.icon className="h-6 w-6" />
                        </div>
                        <span className="text-4xl font-bold text-slate-200">
                          {step.step}
                        </span>
                      </div>
                      <CardTitle className="text-xl text-slate-900">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-slate-600">{step.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {step.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="bg-slate-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Industrial-Strength Practice Management
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Every feature you need to run a professional dental clinic.
                Built for reliability, designed for ease of use.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100">
                      <feature.icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <CardTitle className="text-lg text-slate-900">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-teal-600">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                One plan, everything included. No hidden fees, no feature
                tiers—just powerful software at a fair price.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-lg">
              <Card className="relative overflow-hidden border-2 border-teal-600 bg-white shadow-xl">
                {/* Popular Badge */}
                <div className="absolute right-4 top-4">
                  <span className="inline-flex items-center rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>

                <CardHeader className="pb-4 pt-8">
                  <CardTitle className="text-2xl text-slate-900">
                    Professional Plan
                  </CardTitle>
                  <p className="mt-2 text-slate-600">
                    Everything you need to run your dental clinic
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      ₹599
                    </span>
                    <span className="text-lg text-slate-500">/month</span>
                  </div>

                  <p className="text-sm text-slate-500">
                    Billed monthly. Cancel anytime.
                  </p>

                  {/* CTA */}
                  <Link href="/signup" className="block">
                    <Button className="w-full bg-teal-600 py-6 text-lg font-semibold text-white shadow-lg hover:bg-teal-700">
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Features */}
                  <div className="border-t border-slate-200 pt-6">
                    <p className="mb-4 text-sm font-semibold text-slate-900">
                      Everything included:
                    </p>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {pricingFeatures.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Note */}
              <div className="mt-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4 text-teal-600" />
                  <span>Secure payments</span>
                </div>
                <div className="hidden h-4 w-px bg-slate-300 sm:block" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Zap className="h-4 w-4 text-teal-600" />
                  <span>Instant activation</span>
                </div>
                <div className="hidden h-4 w-px bg-slate-300 sm:block" />
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <HeartPulse className="h-4 w-4 text-teal-600" />
                  <span>Free onboarding</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-teal-600 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Practice?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-100">
              Join 500+ dental clinics across India already using DentaEdge.
              Start your free trial today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-xl bg-white px-8 text-lg font-semibold text-teal-600 shadow-lg hover:bg-slate-100 sm:w-auto"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link
                href="mailto:hello@DentaEdge.health"
                className="text-base font-medium text-teal-100 hover:text-white"
              >
                Contact Sales →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <span className="text-xl font-bold text-slate-900">
                  DentaEdge
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                The professional dental practice management system. Streamline
                your clinic operations, enhance patient care, and grow your
                practice.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-teal-600" />
                  HIPAA Ready
                </div>
                <div className="flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5 text-teal-600" />
                  NABH Compliant
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Platform</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Company</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 sm:flex-row">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} DentaEdge. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Made in India 🇮🇳</span>
              <span>•</span>
              <span>Data hosted in India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
