"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MapPin, Sparkles, Stethoscope } from "lucide-react";

const toothLibrary = [
  {
    id: "UR6",
    friendlyName: "First molar (upper right)",
    label: "Upper right first molar",
    type: "Molar",
    education:
      "Primary chewing tooth with wide grooves. Highlight how sealants or crowns protect long-term biting strength.",
    commonConcerns: ["Deep grooves", "Old fillings", "Night grinding"],
    careTips: [
      "Demonstrate floss threaders or interdental brushes.",
      "Discuss night guard options if wear facets are visible.",
      "Note existing restorations and recall dates."
    ]
  },
  {
    id: "LL1",
    friendlyName: "Front tooth (lower left)",
    label: "Lower left central incisor",
    type: "Incisor",
    education:
      "Lower incisors support speech and bite thin foods. They also collect tartar quickly due to salivary glands nearby.",
    commonConcerns: ["Crowding", "Tartar", "Wear"],
    careTips: [
      "Schedule regular scaling behind the tooth.",
      "Recommend retainers if crowding returns post-orthodontics.",
      "Document photographs for before/after comparisons."
    ]
  },
  {
    id: "LR6",
    friendlyName: "First molar (lower right)",
    label: "Lower right first molar",
    type: "Molar",
    education:
      "Carries heavy chewing force. Useful for explaining crowns, bridges, or implant-supported dentistry to patients.",
    commonConcerns: ["Large fillings", "Night grinding"],
    careTips: [
      "Check occlusion after restorative work.",
      "Suggest night guard impressions for bruxism.",
      "Record bite-wing x-rays to monitor recurrent decay."
    ]
  }
];

type Tooth = (typeof toothLibrary)[number];

const tabItems = [
  { id: "overview", label: "Overview" },
  { id: "care", label: "Care tips" },
  { id: "notes", label: "Chair-side notes" }
] as const;

type ToothTab = (typeof tabItems)[number]["id"];

function useInitialTooth(): Tooth {
  return useMemo(() => toothLibrary[0], []);
}

export default function DentalExplorerPage() {
  const selectedTooth = useInitialTooth();
  const [activeTab, setActiveTab] = useState<ToothTab>("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-100/60 px-3 py-1 text-xs font-semibold text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive dental explorer
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
            Explore every tooth together in 3D
          </CardTitle>
          <CardDescription className="max-w-3xl text-sm text-slate-600">
            Rotate the realistic 3D model, zoom into a tooth, and use the right panel to explain concerns, care plans, and notes in simple language.
          </CardDescription>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="border-slate-200 bg-slate-900/90 text-white shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Immersive 3D mouth</CardTitle>
            <CardDescription className="text-slate-300">
              Hover to highlight teeth, click to zoom in. Use the controls on the model to rotate, zoom, and move around the mouth just like in-clinic demos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
              <div className="relative w-full" style={{ paddingTop: "65%" }}>
                <iframe
                  title="Human mouth detailed"
                  src="https://sketchfab.com/models/522eda0ec0e3413a914b1b298a791320/embed"
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  xr-spatial-tracking="true"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-4 py-3 text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                  3D model courtesy of Sketchfab · Mince
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-400" />
                  Use full-screen mode for chair-side counselling
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white/95 shadow-xl">
            <CardHeader className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-700">
                  {selectedTooth.type}
                </Badge>
                <CardTitle className="text-2xl text-slate-900">{selectedTooth.friendlyName}</CardTitle>
                <CardDescription className="text-slate-600">{selectedTooth.label}</CardDescription>
              </div>
              <Separator />
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ToothTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {tabItems.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="overview" className="space-y-4 text-sm text-slate-600">
                  <p>{selectedTooth.education}</p>
                  <div>
                    <p className="font-semibold text-slate-900">Discuss with the patient:</p>
                    <ul className="mt-2 space-y-1">
                      {selectedTooth.commonConcerns.map((concern) => (
                        <li key={concern} className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-sky-500" />
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="care" className="space-y-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Care checklist:</p>
                  <ul className="space-y-2">
                    {selectedTooth.careTips.map((tip) => (
                      <li key={tip} className="rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="notes" className="space-y-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Chair-side notes to capture:</p>
                  <ul className="space-y-1 pl-4">
                    <li>• Visual findings (marks, cracks, shade)</li>
                    <li>• Restorations or planned procedures</li>
                    <li>• Suggested recall timeline</li>
                  </ul>
                  <Button variant="outline" className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100">
                    Add to patient chart
                  </Button>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

        </div>
      </div>

      <Card className="border-slate-200 bg-slate-900/90 text-white shadow-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Sectional oral anatomy</CardTitle>
          <CardDescription className="text-slate-300">
            Switch to this internal view when you want to explain soft-tissue relationships, tongue position, or palatal anatomy alongside tooth discussions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
            <div className="relative w-full" style={{ paddingTop: "65%" }}>
              <iframe
                title="Oral cavity"
                src="https://sketchfab.com/models/64d4e31440ba48ee9e1ecccf6fe0ac17/embed"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                xr-spatial-tracking="true"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-4 py-3 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-400" />
                3D model courtesy of Sketchfab · University of Dundee
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-400" />
                Ideal for explaining palate, uvula, and soft-tissue concerns
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
