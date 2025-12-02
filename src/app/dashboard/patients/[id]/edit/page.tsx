"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { patientsAPI } from "@/lib/api";

export default function EditPatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    emergency: true,
    medical: true,
    dental: true,
    insurance: true,
  });

  const conditions = [
    "Diabetes",
    "Hypertension",
    "Heart Disease",
    "Asthma",
    "Allergies",
    "Bleeding Disorders",
    "HIV/AIDS",
    "Hepatitis",
  ];

  useEffect(() => {
    fetchPatient();
  }, [params.id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const data = await patientsAPI.getById(params.id);
      setPatient(data);
      
      // Parse medical conditions from medical history
      if (data.medicalHistory) {
        const conditionsArray = data.medicalHistory.split(", ").filter((c: string) => conditions.includes(c));
        setMedicalConditions(conditionsArray);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    setMedicalConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const patientData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        dateOfBirth: formData.get("dob"),
        gender: formData.get("gender"),
        bloodGroup: formData.get("bloodGroup") || undefined,
        height: formData.get("height") ? parseFloat(formData.get("height") as string) : undefined,
        weight: formData.get("weight") ? parseFloat(formData.get("weight") as string) : undefined,
        mobileNumber: formData.get("phone"),
        alternateMobileNumber: formData.get("alternatePhone") || undefined,
        email: formData.get("email") || undefined,
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        pinCode: formData.get("pinCode"),
        aadharNumber: formData.get("aadhar") || undefined,
        emergencyContactName: formData.get("emergencyName"),
        emergencyMobileNumber: formData.get("emergencyPhone"),
        relationship: formData.get("emergencyRelation"),
        medicalHistory: medicalConditions.length > 0 ? medicalConditions.join(", ") : formData.get("previousSurgeries") || undefined,
        dentalHistory: formData.get("previousDentalWork") || undefined,
        allergies: formData.get("allergies") || undefined,
        currentMedications: formData.get("medications") || undefined,
        previousSurgeries: formData.get("previousSurgeries") || undefined,
        dentalConcerns: formData.get("dentalConcerns") || undefined,
        previousDentalWork: formData.get("previousDentalWork") || undefined,
        preferredPaymentMode: formData.get("paymentMode") || "cash",
        insuranceProvider: formData.get("insuranceProvider") || undefined,
        sumInsured: formData.get("sumInsured") ? parseFloat(formData.get("sumInsured") as string) : undefined,
      };

      await patientsAPI.update(params.id, patientData);
      router.push(`/dashboard/patients/${params.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await patientsAPI.delete(params.id);
      router.push("/dashboard/patients");
    } catch (err: any) {
      setError(err.message || "Failed to delete patient. Please try again.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Patient not found</p>
              <Link href="/dashboard/patients">
                <Button className="mt-4">
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Patients
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/patients/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Patient</h1>
            <p className="text-muted-foreground">Update patient details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting || isSubmitting}>
                <Trash2 className="mr-2 size-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the patient and all associated data including treatments, appointments, and documents.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Patient"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button type="submit" form="patient-form" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Update Patient
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic patient details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" placeholder="John" required defaultValue={patient.firstName} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" placeholder="Doe" required defaultValue={patient.lastName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number</Label>
                <Input id="aadhar" name="aadhar" placeholder="1234 5678 9012" defaultValue={patient.aadharNumber || ""} />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" required defaultValue={formatDate(patient.dateOfBirth)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" required defaultValue={patient.gender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select name="bloodGroup" defaultValue={patient.bloodGroup || ""}>
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" name="height" type="number" placeholder="170" defaultValue={patient.height || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" placeholder="70" defaultValue={patient.weight || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How to reach the patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number *</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" required defaultValue={patient.mobileNumber} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Mobile Number</Label>
                <Input id="alternatePhone" name="alternatePhone" type="tel" placeholder="+91 98765 43211" defaultValue={patient.alternateMobileNumber || ""} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="john.doe@example.com" defaultValue={patient.email || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input id="address" name="address" placeholder="House No., Street Name, Area" required defaultValue={patient.address} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" placeholder="Mumbai" required defaultValue={patient.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select name="state" required defaultValue={patient.state}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                    <SelectItem value="Assam">Assam</SelectItem>
                    <SelectItem value="Bihar">Bihar</SelectItem>
                    <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                    <SelectItem value="Goa">Goa</SelectItem>
                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                    <SelectItem value="Haryana">Haryana</SelectItem>
                    <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                    <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Kerala">Kerala</SelectItem>
                    <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Manipur">Manipur</SelectItem>
                    <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                    <SelectItem value="Mizoram">Mizoram</SelectItem>
                    <SelectItem value="Nagaland">Nagaland</SelectItem>
                    <SelectItem value="Odisha">Odisha</SelectItem>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                    <SelectItem value="Sikkim">Sikkim</SelectItem>
                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                    <SelectItem value="Telangana">Telangana</SelectItem>
                    <SelectItem value="Tripura">Tripura</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                    <SelectItem value="West Bengal">West Bengal</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Puducherry">Puducherry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode">PIN Code *</Label>
                <Input id="pinCode" name="pinCode" placeholder="400001" maxLength={6} required defaultValue={patient.pinCode} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('emergency')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Emergency Contact (Optional)</CardTitle>
                <CardDescription>Person to contact in case of emergency</CardDescription>
              </div>
              {expandedSections.emergency ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {expandedSections.emergency && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input id="emergencyName" name="emergencyName" placeholder="Jane Doe" defaultValue={patient.emergencyContactName || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relationship</Label>
                  <Input id="emergencyRelation" name="emergencyRelation" placeholder="Spouse" defaultValue={patient.relationship || ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Mobile Number</Label>
                <Input id="emergencyPhone" name="emergencyPhone" type="tel" placeholder="+91 98765 43210" defaultValue={patient.emergencyMobileNumber || ""} />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Medical History */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('medical')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Medical History (Optional)</CardTitle>
                <CardDescription>Patient's medical background</CardDescription>
              </div>
              {expandedSections.medical ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {expandedSections.medical && (
            <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Pre-existing Medical Conditions</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {conditions.map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition}
                      checked={medicalConditions.includes(condition)}
                      onCheckedChange={() => toggleCondition(condition)}
                    />
                    <label
                      htmlFor={condition}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {condition}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (Drug/Food/Other)</Label>
              <Textarea
                id="allergies"
                name="allergies"
                placeholder="List any allergies (e.g., Penicillin, Latex, etc.)"
                rows={3}
                defaultValue={patient.allergies || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                name="medications"
                placeholder="List all current medications with dosage"
                rows={3}
                defaultValue={patient.currentMedications || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousSurgeries">Previous Surgeries/Hospitalizations</Label>
              <Textarea
                id="previousSurgeries"
                name="previousSurgeries"
                placeholder="Describe any previous surgeries or hospital stays"
                rows={3}
                defaultValue={patient.previousSurgeries || ""}
              />
            </div>
            </CardContent>
          )}
        </Card>

        {/* Dental History */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('dental')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dental History (Optional)</CardTitle>
                <CardDescription>Patient's dental background and concerns</CardDescription>
              </div>
              {expandedSections.dental ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {expandedSections.dental && (
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dentalConcerns">Current Dental Concerns/Complaints</Label>
              <Textarea
                id="dentalConcerns"
                name="dentalConcerns"
                placeholder="Describe any current dental issues or concerns"
                rows={3}
                defaultValue={patient.dentalConcerns || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousDentalWork">Previous Dental Work</Label>
              <Textarea
                id="previousDentalWork"
                name="previousDentalWork"
                placeholder="List any previous dental procedures (fillings, root canals, crowns, etc.)"
                rows={3}
                defaultValue={patient.previousDentalWork || ""}
              />
            </div>
            </CardContent>
          )}
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('insurance')}
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Insurance/Payment Information (Optional)</CardTitle>
                <CardDescription>Patient's insurance or payment details</CardDescription>
              </div>
              {expandedSections.insurance ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </CardHeader>
          {expandedSections.insurance && (
            <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Preferred Payment Mode</Label>
              <Select name="paymentMode" defaultValue={patient.preferredPaymentMode || "cash"}>
                <SelectTrigger id="paymentMode">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI/Digital Payment</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="insurance">Medical Insurance</SelectItem>
                  <SelectItem value="cghs">CGHS</SelectItem>
                  <SelectItem value="esis">ESIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Select name="insuranceProvider" defaultValue={patient.insuranceProvider || ""}>
                  <SelectTrigger id="insuranceProvider">
                    <SelectValue placeholder="Select insurance provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Star Health Insurance">Star Health Insurance</SelectItem>
                    <SelectItem value="ICICI Lombard">ICICI Lombard</SelectItem>
                    <SelectItem value="HDFC ERGO">HDFC ERGO</SelectItem>
                    <SelectItem value="Max Bupa">Max Bupa</SelectItem>
                    <SelectItem value="Care Health Insurance">Care Health Insurance</SelectItem>
                    <SelectItem value="Bajaj Allianz">Bajaj Allianz</SelectItem>
                    <SelectItem value="Reliance Health Insurance">Reliance Health Insurance</SelectItem>
                    <SelectItem value="CGHS">CGHS</SelectItem>
                    <SelectItem value="ESIS">ESIS</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sumInsured">Sum Insured (₹)</Label>
                <Input id="sumInsured" name="sumInsured" type="number" placeholder="500000" defaultValue={patient.sumInsured || ""} />
              </div>
            </div>
            </CardContent>
          )}
        </Card>

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/patients/${params.id}`}>
            <Button variant="outline" disabled={isSubmitting || isDeleting}>Cancel</Button>
          </Link>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting || isDeleting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Update Patient
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

