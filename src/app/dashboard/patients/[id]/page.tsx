"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Activity,
  User,
  Heart,
  Pill,
  ClipboardList,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
  Upload,
  Eye,
  Download,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { patientsAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClinicalImagesGallery } from "@/components/clinical/clinical-images-gallery";
import { ConsentManager } from "@/components/clinical/consent-manager";
import { DentalChart } from "@/components/clinical/dental-chart";
import { PrescriptionGenerator } from "@/components/clinical/prescription-generator";
import { MultiVisitTracker } from "@/components/clinical/multi-visit-tracker";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Document upload state
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("OTHER");
  const [documentNotes, setDocumentNotes] = useState("");

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const data = await patientsAPI.getById(id);
      setPatient(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name);
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!documentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a document name",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("patientId", id);
      formData.append("name", documentName);
      formData.append("type", documentType);
      formData.append("notes", documentNotes);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset form
      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentName("");
      setDocumentType("OTHER");
      setDocumentNotes("");

      // Refresh patient data
      fetchPatient();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "document";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{error || "Patient not found"}</p>
              <Button onClick={() => router.push("/dashboard/patients")} className="mt-4">
                <ArrowLeft className="mr-2 size-4" />
                Back to Patients
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const age = Math.floor(
      (new Date().getTime() - new Date(dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );
    return age;
  };

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">Patient ID: {patient.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/patients/${id}/add-treatment`}>
            <Button className="bg-primary">
              <FileText className="mr-2 size-4" />
              Add Treatment
            </Button>
          </Link>
          <Link href={`/dashboard/patients/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 size-4" />
              Edit Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Treatments</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.stats?.totalTreatments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{patient.stats?.totalCost || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{patient.stats?.pendingAmount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.stats?.totalAppointments || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="clinical-images">Clinical Images</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{patient.bloodGroup || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-muted-foreground" />
                      <span>{patient.mobileNumber}</span>
                    </div>
                    {patient.alternateMobileNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" />
                        <span>{patient.alternateMobileNumber}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-muted-foreground mt-1" />
                    <div>
                      <p>{patient.address}</p>
                      <p>{patient.city}, {patient.state} - {patient.pinCode}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="size-5" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Medical History</p>
                  <p className="text-sm">{patient.medicalHistory || "None"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Dental History</p>
                  <p className="text-sm">{patient.dentalHistory || "None"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Allergies</p>
                  <p className="text-sm">{patient.allergies || "None"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Current Medications</p>
                  <p className="text-sm">{patient.currentMedications || "None"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{patient.emergencyContactName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="font-medium">{patient.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{patient.emergencyMobileNumber}</p>
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium">{patient.insuranceProvider || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sum Insured</p>
                  <p className="font-medium">₹{patient.sumInsured || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Treatment History</CardTitle>
              <CardDescription>All treatments for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.treatments && patient.treatments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.treatments.map((treatment: any) => (
                      <TableRow key={treatment.id}>
                        <TableCell>{new Date(treatment.treatmentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{treatment.diagnosis}</TableCell>
                        <TableCell>₹{treatment.cost}</TableCell>
                        <TableCell>₹{treatment.paidAmount}</TableCell>
                        <TableCell>
                          <Badge variant={treatment.cost === treatment.paidAmount ? "default" : "secondary"}>
                            {treatment.cost === treatment.paidAmount ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/patients/${id}/treatment/${treatment.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No treatments yet</p>
                  <Link href={`/dashboard/patients/${id}/add-treatment`}>
                    <Button className="mt-4">Add First Treatment</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>All appointments for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.appointments && patient.appointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((appointment: any) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                        <TableCell>{appointment.time}</TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>
                          <Badge variant={
                            appointment.status === "completed" ? "default" :
                            appointment.status === "scheduled" ? "secondary" : "outline"
                          }>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{appointment.notes || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No appointments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Patient documents and files</CardDescription>
                </div>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 size-4" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patient.documents && patient.documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doc.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.id)}
                            >
                              <Download className="mr-2 size-4" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Images Tab */}
        <TabsContent value="clinical-images">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Images</CardTitle>
              <CardDescription>X-rays, photos, and scans</CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicalImagesGallery patientId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents">
          <Card>
            <CardHeader>
              <CardTitle>Consent Forms</CardTitle>
              <CardDescription>Digital consent documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <ConsentManager patientId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for this patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                placeholder="e.g., X-Ray Report"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="X_RAY">X-Ray</SelectItem>
                  <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                  <SelectItem value="LAB_REPORT">Lab Report</SelectItem>
                  <SelectItem value="TREATMENT_PLAN">Treatment Plan</SelectItem>
                  <SelectItem value="CONSENT_FORM">Consent Form</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="documentNotes">Notes (Optional)</Label>
              <Textarea
                id="documentNotes"
                placeholder="Add any additional notes..."
                rows={3}
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setSelectedFile(null);
                setDocumentName("");
                setDocumentType("OTHER");
                setDocumentNotes("");
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
