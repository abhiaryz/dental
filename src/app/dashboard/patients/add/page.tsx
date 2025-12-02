"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { patientsAPI } from "@/lib/api";

export default function AddPatientPage() {
  const router = useRouter();
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    emergency: false,
    medical: false,
    dental: false,
    insurance: false,
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
        preferredPaymentMode: formData.get("paymentMode") || "cash",
        insuranceProvider: formData.get("insuranceProvider") || undefined,
        sumInsured: formData.get("sumInsured") ? parseFloat(formData.get("sumInsured") as string) : undefined,
      };

      const newPatient = await patientsAPI.create(patientData);
      router.push(`/dashboard/patients/${newPatient.id}/add-treatment`);
    } catch (err: any) {
      setError(err.message || "Failed to create patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Patient</h1>
            <p className="text-muted-foreground">Enter patient details for registration</p>
          </div>
        </div>
        <Button type="submit" form="patient-form" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Patient
            </>
          )}
        </Button>
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
                <Input id="firstName" name="firstName" placeholder="John" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" placeholder="Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhar">Aadhar Number</Label>
                <Input id="aadhar" name="aadhar" placeholder="1234 5678 9012" />
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" required>
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
                <Select name="bloodGroup">
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
                <Input id="height" name="height" type="number" placeholder="170" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" placeholder="70" />
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
                <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Mobile Number</Label>
                <Input id="alternatePhone" name="alternatePhone" type="tel" placeholder="+91 98765 43211" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="john.doe@example.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input id="address" name="address" placeholder="House No., Street Name, Area" required />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" placeholder="Mumbai" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select name="state" required>
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
                <Input id="pinCode" name="pinCode" placeholder="400001" maxLength={6} required />
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
                  <Input id="emergencyName" name="emergencyName" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relationship</Label>
                  <Input id="emergencyRelation" name="emergencyRelation" placeholder="Spouse" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Mobile Number</Label>
                <Input id="emergencyPhone" name="emergencyPhone" type="tel" placeholder="+91 98765 43210" />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                name="medications"
                placeholder="List all current medications with dosage"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousSurgeries">Previous Surgeries/Hospitalizations</Label>
              <Textarea
                id="previousSurgeries"
                name="previousSurgeries"
                placeholder="Describe any previous surgeries or hospital stays"
                rows={3}
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousDentalWork">Previous Dental Work</Label>
              <Textarea
                id="previousDentalWork"
                name="previousDentalWork"
                placeholder="List any previous dental procedures (fillings, root canals, crowns, etc.)"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brushingFrequency">Brushing Frequency</Label>
                <Select>
                  <SelectTrigger id="brushingFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once a day</SelectItem>
                    <SelectItem value="twice">Twice a day</SelectItem>
                    <SelectItem value="thrice">Three times a day</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flossingFrequency">Flossing Frequency</Label>
                <Select>
                  <SelectTrigger id="flossingFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Few times a week</SelectItem>
                    <SelectItem value="rarely">Rarely</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dental Habits/Issues</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="grindsTeeth" />
                  <label htmlFor="grindsTeeth" className="text-sm font-medium">
                    Grinds teeth
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="clenches" />
                  <label htmlFor="clenches" className="text-sm font-medium">
                    Clenches jaw
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="bleedingGums" />
                  <label htmlFor="bleedingGums" className="text-sm font-medium">
                    Bleeding gums
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="sensitiveTeath" />
                  <label htmlFor="sensitiveTeath" className="text-sm font-medium">
                    Sensitive teeth
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="badBreath" />
                  <label htmlFor="badBreath" className="text-sm font-medium">
                    Bad breath
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="smoker" />
                  <label htmlFor="smoker" className="text-sm font-medium">
                    Smoker/Tobacco user
                  </label>
                </div>
              </div>
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
              <Select name="paymentMode">
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
                <Select name="insuranceProvider">
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
                <Input id="sumInsured" name="sumInsured" type="number" placeholder="500000" />
              </div>
            </div>
            </CardContent>
          )}
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any other relevant information</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="additionalNotes"
              placeholder="Add any additional notes or special instructions"
              rows={4}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/patients">
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </Link>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Patient
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

