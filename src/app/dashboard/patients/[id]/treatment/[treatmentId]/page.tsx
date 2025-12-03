"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Receipt,
  Activity,
  IndianRupee,
  User,
  Clock,
  Stethoscope,
  Pill,
  ClipboardList,
  Calendar,
  Loader2,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { treatmentsAPI, invoicesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { invoiceSchema, validateData } from "@/lib/validation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicalImagesGallery } from "@/components/clinical/clinical-images-gallery";
import { DentalChart } from "@/components/clinical/dental-chart";
import { PrescriptionGenerator } from "@/components/clinical/prescription-generator";
import { MultiVisitTracker } from "@/components/clinical/multi-visit-tracker";

export default function TreatmentDetailPage({ 
  params 
}: { 
  params: { id: string; treatmentId: string } 
}) {
  const router = useRouter();
  const [treatment, setTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Generate Invoice Dialog State
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    dueDate: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
  });
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTreatment = async () => {
      try {
        setLoading(true);
        const data = await treatmentsAPI.getById(params.treatmentId);
        setTreatment(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    void fetchTreatment();
  }, [params.treatmentId]);

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/reports/treatment/${params.treatmentId}`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `treatment-report-${params.treatmentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download treatment report");
    }
  };

  const handlePrintReport = async () => {
    try {
      const response = await fetch(`/api/reports/treatment/${params.treatmentId}`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing report:", error);
      alert("Failed to print treatment report");
    }
  };

  const openInvoiceDialog = () => {
    if (treatment) {
      // Pre-fill invoice form with treatment data
      setInvoiceFormData({
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        notes: treatment.notes || "",
        items: [
          {
            description: `Treatment: ${treatment.chiefComplaint || "Dental Treatment"}`,
            quantity: 1,
            unitPrice: treatment.cost || 0,
          },
        ],
      });
    }
    setShowInvoiceDialog(true);
  };

  const handleGenerateInvoice = async () => {
    try {
      // Clear previous errors
      setInvoiceErrors({});

      if (!treatment) {
        toast({
          title: "Error",
          description: "Treatment data not available",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for validation
      const dataToValidate = {
        patientId: treatment.patientId,
        ...invoiceFormData,
      };

      // Validate form with Zod
      const validation = validateData(invoiceSchema, dataToValidate);
      
      if (!validation.success) {
        setInvoiceErrors(validation.errors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }

      setInvoiceSaving(true);

      const invoiceData = {
        patientId: treatment.patientId,
        dueDate: invoiceFormData.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        notes: invoiceFormData.notes,
        items: invoiceFormData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await invoicesAPI.create(invoiceData);

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      setShowInvoiceDialog(false);
      resetInvoiceForm();

      // Optionally navigate to invoice or stay on treatment page
      router.push("/dashboard/finance");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setInvoiceSaving(false);
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      dueDate: "",
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
    });
    setInvoiceErrors({});
  };

  const addInvoiceItem = () => {
    setInvoiceFormData({
      ...invoiceFormData,
      items: [...invoiceFormData.items, { description: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeInvoiceItem = (index: number) => {
    const newItems = invoiceFormData.items.filter((_, i) => i !== index);
    setInvoiceFormData({ ...invoiceFormData, items: newItems });
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceFormData({ ...invoiceFormData, items: newItems });
  };

  const calculateTotal = () => {
    return invoiceFormData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !treatment) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{error || "Treatment not found"}</p>
              <Button onClick={() => router.push(`/dashboard/patients/${params.id}`)} className="mt-4">
                <ArrowLeft className="mr-2 size-4" />
                Back to Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patient = treatment.patient;
  const pendingAmount = treatment.cost - treatment.paidAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/patients/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Treatment Details</h1>
            <p className="text-muted-foreground">Treatment ID: {treatment.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownloadReport()}>
            <Download className="mr-2 size-4" />
            Download
          </Button>
          <Button variant="outline" onClick={() => handlePrintReport()}>
            <Printer className="mr-2 size-4" />
            Print
          </Button>
          <Button className="bg-primary" onClick={() => openInvoiceDialog()}>
            <Receipt className="mr-2 size-4" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treatment Cost</CardTitle>
            <IndianRupee className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{treatment.cost}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{treatment.paidAmount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{pendingAmount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{patient.firstName} {patient.lastName}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{patient.mobileNumber}</p>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5" />
              Treatment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Treatment Date</p>
              <p className="font-medium">{new Date(treatment.treatmentDate).toLocaleDateString()}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={pendingAmount === 0 ? "default" : "secondary"}>
                {pendingAmount === 0 ? "Paid" : "Pending"}
              </Badge>
            </div>
            {treatment.selectedTeeth && treatment.selectedTeeth.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Affected Teeth</p>
                  <p className="font-medium">{treatment.selectedTeeth.join(", ")}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Chief Complaint */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5" />
              Chief Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{treatment.chiefComplaint}</p>
          </CardContent>
        </Card>

        {/* Clinical Findings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Clinical Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{treatment.clinicalFindings}</p>
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5" />
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{treatment.diagnosis}</p>
          </CardContent>
        </Card>

        {/* Treatment Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Treatment Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{treatment.treatmentPlan}</p>
          </CardContent>
        </Card>

        {/* Prescription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="size-5" />
              Prescription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm">{treatment.prescription}</div>
          </CardContent>
        </Card>

        {/* Notes */}
        {treatment.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{treatment.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Follow-up */}
        {treatment.followUpDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Follow-up Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(treatment.followUpDate).toLocaleDateString()}</p>
              </div>
              {treatment.followUpNotes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{treatment.followUpNotes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Clinical Tools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Clinical Tools</h2>
            <p className="text-sm text-muted-foreground">
              Advanced clinical documentation and tracking
            </p>
          </div>
          <PrescriptionGenerator 
            treatmentId={params.treatmentId} 
            patientId={params.id}
          />
        </div>

        <Tabs defaultValue="visits" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visits">Multi-Visit Tracker</TabsTrigger>
            <TabsTrigger value="dental-chart">Dental Chart</TabsTrigger>
            <TabsTrigger value="images">Clinical Images</TabsTrigger>
          </TabsList>

          <TabsContent value="visits">
            <Card>
              <CardContent className="pt-6">
                <MultiVisitTracker treatmentId={params.treatmentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dental-chart">
            <Card>
              <CardContent className="pt-6">
                <DentalChart treatmentId={params.treatmentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <Card>
              <CardContent className="pt-6">
                <ClinicalImagesGallery 
                  patientId={params.id} 
                  treatmentId={params.treatmentId}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create an invoice from this treatment with itemized billing details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceFormData.dueDate}
                onChange={(e) =>
                  setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })
                }
              />
            </div>

            {/* Invoice Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Invoice Items *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                >
                  <Plus className="size-4 mr-2" />
                  Add Item
                </Button>
              </div>
              {invoiceErrors.items && (
                <p className="text-sm text-red-500">{invoiceErrors.items}</p>
              )}

              <div className="space-y-3">
                {invoiceFormData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 border rounded-lg"
                  >
                    <div className="col-span-1 sm:col-span-5">
                      <Label htmlFor={`item-desc-${index}`} className="text-xs">
                        Description
                      </Label>
                      <Input
                        id={`item-desc-${index}`}
                        placeholder="e.g., Root Canal Treatment"
                        value={item.description}
                        onChange={(e) =>
                          updateInvoiceItem(index, "description", e.target.value)
                        }
                        className={invoiceErrors[`items.${index}.description`] ? "border-red-500" : ""}
                      />
                      {invoiceErrors[`items.${index}.description`] && (
                        <p className="text-xs text-red-500 mt-1">{invoiceErrors[`items.${index}.description`]}</p>
                      )}
                    </div>

                    <div className="col-span-1 sm:col-span-3">
                      <Label htmlFor={`item-qty-${index}`} className="text-xs">
                        Quantity
                      </Label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className={invoiceErrors[`items.${index}.quantity`] ? "border-red-500" : ""}
                      />
                      {invoiceErrors[`items.${index}.quantity`] && (
                        <p className="text-xs text-red-500 mt-1">{invoiceErrors[`items.${index}.quantity`]}</p>
                      )}
                    </div>

                    <div className="col-span-1 sm:col-span-3">
                      <Label htmlFor={`item-price-${index}`} className="text-xs">
                        Unit Price (₹)
                      </Label>
                      <Input
                        id={`item-price-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateInvoiceItem(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={invoiceErrors[`items.${index}.unitPrice`] ? "border-red-500" : ""}
                      />
                      {invoiceErrors[`items.${index}.unitPrice`] && (
                        <p className="text-xs text-red-500 mt-1">{invoiceErrors[`items.${index}.unitPrice`]}</p>
                      )}
                    </div>

                    <div className="col-span-1 sm:col-span-1 flex items-end justify-end sm:justify-start">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvoiceItem(index)}
                        disabled={invoiceFormData.items.length === 1}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end items-center gap-2 p-4 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-2xl font-bold text-primary">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes or payment terms..."
                rows={3}
                value={invoiceFormData.notes}
                onChange={(e) =>
                  setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoiceDialog(false);
                resetInvoiceForm();
              }}
              disabled={invoiceSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={invoiceSaving}>
              {invoiceSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create Invoice</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
