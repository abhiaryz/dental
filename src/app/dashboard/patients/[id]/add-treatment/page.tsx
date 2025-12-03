"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { patientsAPI, treatmentsAPI, employeesAPI, invoicesAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Stepper } from "@/components/ui/stepper";

// Tooth icon component
const ToothIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C9.5 2 7.5 3.5 7 5.5C6.5 7.5 6 9 6 11C6 13 6.5 15 7 17C7.5 19 8 20.5 9 21.5C9.5 22 10 22 10.5 22C11 22 11.5 21.5 12 20.5C12.5 21.5 13 22 13.5 22C14 22 14.5 22 15 21.5C16 20.5 16.5 19 17 17C17.5 15 18 13 18 11C18 9 17.5 7.5 17 5.5C16.5 3.5 14.5 2 12 2M12 4C13.5 4 14.5 5 15 6.5C15.5 8 16 9.5 16 11C16 12.5 15.5 14 15 15.5C14.7 16.5 14.3 17.5 14 18.5C13.5 17 13.5 15 13 13C12.8 12 12.5 11.5 12 11.5C11.5 11.5 11.2 12 11 13C10.5 15 10.5 17 10 18.5C9.7 17.5 9.3 16.5 9 15.5C8.5 14 8 12.5 8 11C8 9.5 8.5 8 9 6.5C9.5 5 10.5 4 12 4Z" />
  </svg>
);

export default function AddTreatmentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [patientId, setPatientId] = useState<string>("");
  const [patient, setPatient] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedTreatmentType, setSelectedTreatmentType] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [autoGenerateInvoice, setAutoGenerateInvoice] = useState(true);

  const steps = [
    { title: "Basic Info", description: "Date & Doctor" },
    { title: "Clinical Details", description: "Diagnosis & Plan" },
    { title: "Prescription", description: "Teeth & Notes" },
    { title: "Payment", description: "Cost & Amount" },
  ];

  useEffect(() => {
    if (status === "loading") return;

    const fetchData = async (id: string) => {
      try {
        setLoading(true);

        // Fetch patient details
        const patientData = await patientsAPI.getById(id);
        setPatient(patientData);

        const user = session?.user as any;

        // If user belongs to a clinic, fetch employees (doctors)
        if (user?.clinicId) {
          try {
            const employeesData = await employeesAPI.getAll();
            // Filter only doctors (employees with role DOCTOR or DENTIST)
            const doctorsList =
              employeesData.employees?.filter(
                (emp: any) => emp.role === "DOCTOR" || emp.role === "DENTIST"
              ) || [];
            setDoctors(doctorsList);
          } catch (error) {
            console.error("Failed to fetch employees:", error);
            // Don't block the page if fetching doctors fails, but user might be blocked from submitting
            // if validation requires a doctor selected.
          }
        } else if (user) {
          // If no clinic (External Doctor), the current user is the doctor
          setDoctors([
            {
              id: user.id,
              name: user.name || "Doctor",
              role: user.role,
            },
          ]);
          setSelectedDoctor(user.id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
        toast({
          title: "Error",
          description: err.message || "Failed to load patient and doctors",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    params.then((p) => {
      setPatientId(p.id);
      void fetchData(p.id);
    });
  }, [params, session, status, toast]);

  // Tooth numbering system (FDI notation)
  const upperTeeth = [
    { number: "18", name: "3rd Molar" },
    { number: "17", name: "2nd Molar" },
    { number: "16", name: "1st Molar" },
    { number: "15", name: "2nd Premolar" },
    { number: "14", name: "1st Premolar" },
    { number: "13", name: "Canine" },
    { number: "12", name: "Lateral Incisor" },
    { number: "11", name: "Central Incisor" },
    { number: "21", name: "Central Incisor" },
    { number: "22", name: "Lateral Incisor" },
    { number: "23", name: "Canine" },
    { number: "24", name: "1st Premolar" },
    { number: "25", name: "2nd Premolar" },
    { number: "26", name: "1st Molar" },
    { number: "27", name: "2nd Molar" },
    { number: "28", name: "3rd Molar" },
  ];

  const lowerTeeth = [
    { number: "48", name: "3rd Molar" },
    { number: "47", name: "2nd Molar" },
    { number: "46", name: "1st Molar" },
    { number: "45", name: "2nd Premolar" },
    { number: "44", name: "1st Premolar" },
    { number: "43", name: "Canine" },
    { number: "42", name: "Lateral Incisor" },
    { number: "41", name: "Central Incisor" },
    { number: "31", name: "Central Incisor" },
    { number: "32", name: "Lateral Incisor" },
    { number: "33", name: "Canine" },
    { number: "34", name: "1st Premolar" },
    { number: "35", name: "2nd Premolar" },
    { number: "36", name: "1st Molar" },
    { number: "37", name: "2nd Molar" },
    { number: "38", name: "3rd Molar" },
  ];

  const toggleTooth = (toothNumber: string) => {
    setSelectedTeeth((prev) =>
      prev.includes(toothNumber)
        ? prev.filter((t) => t !== toothNumber)
        : [...prev, toothNumber]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!selectedDoctor) {
      setError("Please select a treating doctor");
      toast({
        title: "Validation Error",
        description: "Please select a treating doctor",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTreatmentType) {
      setError("Please select a treatment type");
      toast({
        title: "Validation Error",
        description: "Please select a treatment type",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      setSubmitting(true);
      
      const cost = parseFloat(formData.get("cost") as string) || 0;
      const paidAmount = parseFloat(formData.get("paidAmount") as string) || 0;
      
      // Create treatment
      const treatment = await treatmentsAPI.create({
        patientId: patientId,
        treatmentDate: formData.get("treatmentDate"),
        chiefComplaint: formData.get("chiefComplaint"),
        clinicalFindings: formData.get("clinicalFindings"),
        diagnosis: formData.get("diagnosis"),
        treatmentPlan: formData.get("treatmentPlan"),
        prescription: formData.get("prescription"),
        cost: cost,
        paidAmount: paidAmount,
        selectedTeeth: selectedTeeth.join(","),
        notes: formData.get("notes"),
        doctorId: selectedDoctor,
        treatmentType: selectedTreatmentType,
      });

      // Auto-generate invoice if option is selected and cost > 0
      if (autoGenerateInvoice && cost > 0) {
        try {
          const diagnosis = formData.get("diagnosis") as string;
          const treatmentPlan = formData.get("treatmentPlan") as string;
          
          // Calculate due date (15 days from treatment date)
          const treatmentDate = new Date(formData.get("treatmentDate") as string);
          const dueDate = new Date(treatmentDate);
          dueDate.setDate(dueDate.getDate() + 15);

          await invoicesAPI.create({
            patientId: patientId,
            items: [
              {
                description: `${selectedTreatmentType}: ${diagnosis || treatmentPlan}`,
                quantity: 1,
                unitPrice: cost,
                amount: cost,
              },
            ],
            subtotal: cost,
            tax: cost * 0.18, // 18% tax
            totalAmount: cost * 1.18,
            dueDate: dueDate.toISOString(),
            status: paidAmount >= cost ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING",
            notes: `Auto-generated invoice for treatment on ${treatmentDate.toLocaleDateString()}`,
          });

          toast({
            title: "Success",
            description: "Treatment and invoice created successfully",
          });
        } catch (invoiceError) {
          console.error("Failed to create invoice:", invoiceError);
          toast({
            title: "Partial Success",
            description: "Treatment created but invoice generation failed. You can create an invoice manually.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Treatment added successfully",
        });
      }
      
      router.push(`/dashboard/patients/${patientId}`);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create treatment. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{error || "Patient not found"}</p>
              <Button onClick={() => router.push("/dashboard/patients")} className="mt-4">
                Back to Patients
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/patients/${patientId}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Treatment</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Patient: {patient ? `${patient.firstName} ${patient.lastName}` : "Loading..."}
              </p>
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Treatment
              </>
            )}
          </Button>
        </div>

        {/* Multi-step Stepper */}
        <Card>
          <CardContent className="pt-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Step 1: Basic Info */}
        <Card id="step-1" onClick={() => setCurrentStep(1)}>
          <CardHeader>
            <CardTitle>Step 1: Basic Information</CardTitle>
            <CardDescription>Date, Doctor, and Chief Complaint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="treatmentDate">Treatment Date *</Label>
                <Input id="treatmentDate" name="treatmentDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Treating Doctor *</Label>
                <Select
                  required
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                >
                  <SelectTrigger id="doctor">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.length > 0 ? (
                      doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name || "Doctor"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-doctor" disabled>
                        No doctors available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentType">Treatment Type *</Label>
              <Select
                required
                value={selectedTreatmentType}
                onValueChange={setSelectedTreatmentType}
              >
                <SelectTrigger id="treatmentType">
                  <SelectValue placeholder="Select treatment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="cleaning">Dental Cleaning/Scaling</SelectItem>
                  <SelectItem value="filling">Cavity Filling</SelectItem>
                  <SelectItem value="root-canal">Root Canal Treatment</SelectItem>
                  <SelectItem value="extraction">Tooth Extraction</SelectItem>
                  <SelectItem value="crown">Crown/Cap</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="denture">Denture</SelectItem>
                  <SelectItem value="implant">Dental Implant</SelectItem>
                  <SelectItem value="whitening">Teeth Whitening</SelectItem>
                  <SelectItem value="orthodontic">Orthodontic Treatment</SelectItem>
                  <SelectItem value="gum-treatment">Gum Treatment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
              <Textarea
                id="chiefComplaint"
                name="chiefComplaint"
                placeholder="Patient's main complaint or reason for treatment"
                rows={2}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Clinical Details */}
        <Card id="step-2" onClick={() => setCurrentStep(2)}>
          <CardHeader>
            <CardTitle>Step 2: Clinical Details</CardTitle>
            <CardDescription>Clinical Findings, Diagnosis, and Treatment Plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Upper Teeth</Label>
                <div className="grid grid-cols-8 gap-2">
                  {upperTeeth.map((tooth) => (
                    <div key={tooth.number} className="flex flex-col items-center">
                      <Button
                        type="button"
                        variant={selectedTeeth.includes(tooth.number) ? "default" : "outline"}
                        className={`w-full h-20 flex flex-col gap-1 p-2 ${
                          selectedTeeth.includes(tooth.number)
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => toggleTooth(tooth.number)}
                      >
                        <ToothIcon className="w-5 h-5" />
                        <span className="font-bold text-xs">{tooth.number}</span>
                      </Button>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center">{tooth.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-3 block">Lower Teeth</Label>
                <div className="grid grid-cols-8 gap-2">
                  {lowerTeeth.map((tooth) => (
                    <div key={tooth.number} className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground mb-1 text-center">{tooth.name}</span>
                      <Button
                        type="button"
                        variant={selectedTeeth.includes(tooth.number) ? "default" : "outline"}
                        className={`w-full h-20 flex flex-col gap-1 p-2 ${
                          selectedTeeth.includes(tooth.number)
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        onClick={() => toggleTooth(tooth.number)}
                      >
                        <span className="font-bold text-xs">{tooth.number}</span>
                        <ToothIcon className="w-5 h-5 rotate-180" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedTeeth.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <Label className="text-sm font-medium">Selected Teeth:</Label>
                <p className="text-sm mt-1">{selectedTeeth.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Prescription & Notes */}
        <Card id="step-3" onClick={() => setCurrentStep(3)}>
          <CardHeader>
            <CardTitle>Step 3: Prescription & Tooth Selection</CardTitle>
            <CardDescription>Prescription, Notes, and Selected Teeth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-3 block">Upper Teeth</Label>
              <div className="grid grid-cols-8 gap-2">
                {upperTeeth.map((tooth) => (
                  <div key={tooth.number} className="flex flex-col items-center">
                    <Button
                      type="button"
                      variant={selectedTeeth.includes(tooth.number) ? "default" : "outline"}
                      className={`w-full h-20 flex flex-col gap-1 p-2 ${
                        selectedTeeth.includes(tooth.number)
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                      onClick={() => toggleTooth(tooth.number)}
                    >
                      <ToothIcon className="w-5 h-5" />
                      <span className="font-bold text-xs">{tooth.number}</span>
                    </Button>
                    <span className="text-[10px] text-muted-foreground mt-1 text-center">{tooth.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <Label className="mb-3 block">Lower Teeth</Label>
              <div className="grid grid-cols-8 gap-2">
                {lowerTeeth.map((tooth) => (
                  <div key={tooth.number} className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground mb-1 text-center">{tooth.name}</span>
                    <Button
                      type="button"
                      variant={selectedTeeth.includes(tooth.number) ? "default" : "outline"}
                      className={`w-full h-20 flex flex-col gap-1 p-2 ${
                        selectedTeeth.includes(tooth.number)
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                      onClick={() => toggleTooth(tooth.number)}
                    >
                      <span className="font-bold text-xs">{tooth.number}</span>
                      <ToothIcon className="w-5 h-5 rotate-180" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {selectedTeeth.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <Label className="text-sm font-medium">Selected Teeth:</Label>
                <p className="text-sm mt-1">{selectedTeeth.join(", ")}</p>
              </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-2">
              <Label htmlFor="prescription">Prescription *</Label>
              <Textarea
                id="prescription"
                name="prescription"
                placeholder="List medications with dosage and duration (e.g., Amoxicillin 500mg, 3 times daily for 5 days)"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Post-Treatment Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Care instructions for the patient"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Payment */}
        <Card id="step-4" onClick={() => setCurrentStep(4)}>
          <CardHeader>
            <CardTitle>Step 4: Payment Details</CardTitle>
            <CardDescription>Cost, Payment Mode, and Status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Treatment Cost (₹) *</Label>
                <Input id="cost" name="cost" type="number" placeholder="5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Amount Paid (₹)</Label>
                <Input id="paidAmount" name="paidAmount" type="number" placeholder="0" defaultValue="0" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select required>
                  <SelectTrigger id="paymentMode">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="insurance">Insurance Claim</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status *</Label>
                <Select required>
                  <SelectTrigger id="paymentStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Fully Paid</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" placeholder="RCP-2025-001" />
            </div>

            <Separator className="my-4" />

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="autoInvoice" 
                checked={autoGenerateInvoice}
                onCheckedChange={(checked) => setAutoGenerateInvoice(checked as boolean)}
              />
              <Label htmlFor="autoInvoice" className="text-sm font-normal cursor-pointer">
                Automatically generate invoice for this treatment
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              An invoice will be created with the treatment details and cost. You can edit it later if needed.
            </p>
          </CardContent>
        </Card>

        {/* Follow-up */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-up</CardTitle>
            <CardDescription>Next appointment and follow-up details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="followupRequired" />
              <label
                htmlFor="followupRequired"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Follow-up appointment required
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="followupDate">Follow-up Date</Label>
                <Input id="followupDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="followupTime">Follow-up Time</Label>
                <Input id="followupTime" type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="followupNotes">Follow-up Notes</Label>
              <Textarea
                id="followupNotes"
                placeholder="Notes for next visit"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any other relevant information</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional observations or notes"
              rows={3}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/patients/${patientId}`}>
            <Button variant="outline" disabled={submitting}>Cancel</Button>
          </Link>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Treatment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

