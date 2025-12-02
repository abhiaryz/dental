"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { prescriptionsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PrescriptionGeneratorProps {
  treatmentId: string;
  patientId: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export function PrescriptionGenerator({ treatmentId, patientId }: PrescriptionGeneratorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "" },
  ]);
  const [instructions, setInstructions] = useState("");

  const { toast } = useToast();

  const addMedication = () => {
    setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleGenerate = async () => {
    // Validate medications
    const validMedications = medications.filter((med) => med.name.trim() !== "");
    
    if (validMedications.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one medication",
        variant: "destructive",
      });
      return;
    }

    try {
      setGenerating(true);

      const response = await prescriptionsAPI.generate({
        treatmentId,
        patientId,
        medications: JSON.stringify(validMedications),
        instructions,
      });

      setGeneratedPdfUrl(response.pdfUrl);

      toast({
        title: "Success",
        description: "Prescription generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate prescription",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setGeneratedPdfUrl(null);
    setMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
    setInstructions("");
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} variant="outline">
        <FileText className="mr-2 size-4" />
        Generate Prescription
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Prescription</DialogTitle>
            <DialogDescription>
              Create a professional prescription PDF with clinic letterhead
            </DialogDescription>
          </DialogHeader>

          {!generatedPdfUrl ? (
            <div className="space-y-6">
              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">Medications *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addMedication}>
                    <Plus className="mr-1 size-3" />
                    Add
                  </Button>
                </div>

                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                              <div>
                                <Label className="text-xs">Medicine Name *</Label>
                                <Input
                                  value={med.name}
                                  onChange={(e) => updateMedication(index, "name", e.target.value)}
                                  placeholder="e.g., Amoxicillin"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Dosage</Label>
                                <Input
                                  value={med.dosage}
                                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                                  placeholder="e.g., 500mg"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Frequency</Label>
                                <Input
                                  value={med.frequency}
                                  onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                                  placeholder="e.g., 3 times daily"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Duration</Label>
                                <Input
                                  value={med.duration}
                                  onChange={(e) => updateMedication(index, "duration", e.target.value)}
                                  placeholder="e.g., 7 days"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            {medications.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => removeMedication(index)}
                                className="shrink-0"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="General instructions for the patient (e.g., Take after meals, Avoid alcohol, etc.)"
                  className="mt-1"
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 size-4" />
                  )}
                  Generate PDF
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="size-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Prescription Generated!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your prescription PDF is ready for download
                  </p>
                </div>

                <Button size="lg" asChild>
                  <a href={generatedPdfUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 size-4" />
                    Download Prescription
                  </a>
                </Button>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={() => setGeneratedPdfUrl(null)}>
                  Generate Another
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

