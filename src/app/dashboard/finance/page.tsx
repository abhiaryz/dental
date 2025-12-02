"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Send,
  Search,
  Filter,
  Plus,
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Printer,
  Loader2,
  Trash2,
  X
} from "lucide-react";
import { invoicesAPI, patientsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { exportInvoicesToCSV, exportPaymentsToCSV, exportRevenueReportToCSV } from "@/lib/csv-export";
import { invoiceSchema, paymentWithBalanceSchema, validateData } from "@/lib/validation";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Invoice {
  id: string;
  patientName: string;
  invoiceNumber: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
  items: { description: string; amount: number }[];
}

interface Payment {
  id: string;
  patientName: string;
  amount: number;
  method: string;
  date: string;
  status: "completed" | "processing" | "failed";
  invoiceNumber: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const { toast } = useToast();

  // Filter State
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
  });

  // New Invoice Dialog State
  const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [invoiceFormData, setInvoiceFormData] = useState({
    patientId: "",
    dueDate: "",
    notes: "",
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
  });
  const [invoiceErrors, setInvoiceErrors] = useState<Record<string, string>>({});

  // Record Payment Dialog State
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentMethod: "CASH",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Report State
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState({
    type: 'monthly',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    quarter: 1,
  });

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      
      // Build query params from filters
      const params: any = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      
      const data = await invoicesAPI.getAll(params);
      
      if (data.invoices) {
        // Transform invoices to match UI format
        const transformedInvoices = data.invoices.map((inv: any) => ({
          id: inv.id,
          patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.totalAmount,
          status: inv.status.toLowerCase(),
          date: inv.createdAt,
          dueDate: inv.dueDate,
          items: inv.items || [],
        }));
        
        setInvoices(transformedInvoices);
        
        // Extract payments from invoice payments array
        const allPayments: any[] = [];
        data.invoices.forEach((inv: any) => {
          if (inv.payments && inv.payments.length > 0) {
            inv.payments.forEach((payment: any) => {
              allPayments.push({
                id: payment.id,
                patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
                amount: payment.amount,
                method: payment.paymentMethod,
                date: payment.paymentDate,
                status: payment.status.toLowerCase(),
                invoiceNumber: inv.invoiceNumber,
              });
            });
          }
        });
        
        setPayments(allPayments);
        setStats(data.stats || {});
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await patientsAPI.getAll({ limit: 100 });
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      // Clear previous errors
      setInvoiceErrors({});

      // Validate form with Zod
      const validation = validateData(invoiceSchema, invoiceFormData);
      
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

      // Prepare invoice data
      const invoiceData = {
        patientId: invoiceFormData.patientId,
        dueDate: invoiceFormData.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        notes: invoiceFormData.notes,
        items: invoiceFormData.items.map(item => ({
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

      setShowNewInvoiceDialog(false);
      resetInvoiceForm();
      fetchInvoices();
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
      patientId: "",
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
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const openPaymentDialog = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      setPaymentFormData({
        ...paymentFormData,
        amount: (invoice.amount - (invoice.paidAmount || 0)).toString(),
      });
    }
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = async () => {
    try {
      // Clear previous errors
      setPaymentErrors({});

      if (!selectedInvoiceId) {
        toast({
          title: "Error",
          description: "No invoice selected",
          variant: "destructive",
        });
        return;
      }

      // Get invoice balance for validation
      const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
      const balance = invoice ? invoice.amount - (invoice.paidAmount || 0) : 0;

      // Prepare payment data for validation
      const paymentData = {
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod as any,
        paymentDate: paymentFormData.paymentDate,
        notes: paymentFormData.notes,
      };

      // Validate with balance check
      const validation = validateData(paymentWithBalanceSchema(balance), paymentData);
      
      if (!validation.success) {
        setPaymentErrors(validation.errors);
        toast({
          title: "Validation Error",
          description: Object.values(validation.errors)[0] || "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }

      setPaymentSaving(true);

      await invoicesAPI.recordPayment(selectedInvoiceId, validation.data);

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });

      setShowPaymentDialog(false);
      resetPaymentForm();
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setPaymentSaving(false);
    }
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      amount: "",
      paymentMethod: "CASH",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setPaymentErrors({});
    setSelectedInvoiceId("");
  };

  const handlePrintInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate invoice PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast({
        title: "Error",
        description: "Failed to print invoice",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate invoice PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  // Generate and download revenue report
  const handleGenerateReport = async (period: string) => {
    try {
      setReportLoading(true);
      const params = new URLSearchParams({
        period: reportPeriod.type,
        year: reportPeriod.year.toString(),
      });

      if (reportPeriod.type === 'monthly') {
        params.append('month', reportPeriod.month.toString());
      } else if (reportPeriod.type === 'quarterly') {
        params.append('quarter', reportPeriod.quarter.toString());
      }

      const response = await fetch(`/api/reports/revenue?${params}`);
      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const report = await response.json();
      
      // Generate filename based on period
      let filename = `revenue-report-${reportPeriod.year}`;
      if (reportPeriod.type === 'monthly') {
        filename += `-${String(reportPeriod.month).padStart(2, '0')}`;
      } else if (reportPeriod.type === 'quarterly') {
        filename += `-Q${reportPeriod.quarter}`;
      }

      exportRevenueReportToCSV(report, filename);

      toast({
        title: "Success",
        description: "Report generated and downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setReportLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
      case "completed":
        return <CheckCircle2 className="size-4" />;
      case "pending":
      case "processing":
        return <Clock className="size-4" />;
      case "overdue":
      case "failed":
        return <AlertCircle className="size-4" />;
      default:
        return null;
    }
  };

  const totalRevenue = stats.total || invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const pendingInvoices = invoices.filter((inv) => inv.status === "pending");
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

  const totalPaid = stats.paid || paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = stats.pending || pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = stats.overdue || overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
    <main className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Finance & Billing</h1>
        <p className="text-muted-foreground">
          Manage invoices, payments, and financial analytics
        </p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800 gap-1 border-green-200">
                <TrendingUp className="size-3" />
                +18.2%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected
            </CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalPaid.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{paidInvoices.length} invoices</Badge>
              <span className="text-xs text-muted-foreground">paid</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="size-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalPending.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{pendingInvoices.length} invoices</Badge>
              <span className="text-xs text-muted-foreground">pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="size-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalOverdue.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {overdueInvoices.length} invoices
              </Badge>
              <span className="text-xs text-muted-foreground">overdue</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="size-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="size-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <Plus className="size-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="size-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage and track all patient invoices</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="size-4 mr-2" />
                    Filter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportInvoicesToCSV(invoices, `invoices-${new Date().toISOString().split('T')[0]}`)}
                  >
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary"
                    onClick={() => setShowNewInvoiceDialog(true)}
                  >
                    <Plus className="size-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
              {/* Filter UI */}
              <div className="flex flex-col gap-3 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Date From */}
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />

                  {/* Date To */}
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="To"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    />
                    {(filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFilters({ search: '', status: 'all', dateFrom: '', dateTo: '', paymentMethod: 'all' })}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : invoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No invoices yet"
                  description="Create your first invoice to start tracking payments and billing"
                  action={
                    <Button onClick={() => setShowNewInvoiceDialog(true)}>
                      <Plus className="mr-2 size-4" />
                      Create Invoice
                    </Button>
                  }
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.patientName}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">
                          ₹{invoice.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${getStatusColor(invoice.status)}`}
                          >
                            {getStatusIcon(invoice.status)}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/finance/invoices/${invoice.id}`)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Invoice</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handlePrintInvoice(invoice.id)}
                                >
                                  <Printer className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Print Invoice</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(invoice.id)}
                                >
                                  <Download className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download Invoice</TooltipContent>
                            </Tooltip>
                            {invoice.status !== "paid" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openPaymentDialog(invoice.id)}
                                  >
                                    <CreditCard className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Record Payment</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Payment Tracking</CardTitle>
                  <CardDescription>Monitor all payment transactions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportPaymentsToCSV(payments, `payments-${new Date().toISOString().split('T')[0]}`)}
                  >
                    <Download className="size-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-primary"
                    onClick={() => {
                      // For direct payment recording, we can open dialog without invoice selection
                      // Or we can keep it disabled and only enable from invoice actions
                      toast({
                        title: "Info",
                        description: "Please record payment from the invoice actions in the Invoices tab",
                      });
                    }}
                  >
                    <Plus className="size-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} columns={7} />
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No payments yet"
                  description="Payment transactions will appear here once invoices are paid"
                  action={null}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{payment.patientName}</TableCell>
                        <TableCell>{payment.invoiceNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="size-4 text-muted-foreground" />
                            {payment.method}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${getStatusColor(payment.status)}`}
                          >
                            {getStatusIcon(payment.status)}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Download className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download Receipt</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Invoice Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Invoice</CardTitle>
              <CardDescription>Create a new invoice for patient billing</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="patient">Patient Name *</Label>
                    <Select>
                      <SelectTrigger id="patient">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Priya Sharma</SelectItem>
                        <SelectItem value="2">Rajesh Kumar</SelectItem>
                        <SelectItem value="3">Anita Desai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input id="invoiceDate" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input id="dueDate" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select>
                      <SelectTrigger id="paymentTerms">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Due Immediately</SelectItem>
                        <SelectItem value="15">Net 15 Days</SelectItem>
                        <SelectItem value="30">Net 30 Days</SelectItem>
                        <SelectItem value="60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Invoice Items</Label>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="size-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <Label htmlFor="item1">Description</Label>
                        <Input id="item1" placeholder="e.g., Root Canal Treatment" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="qty1">Qty</Label>
                        <Input id="qty1" type="number" defaultValue="1" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="rate1">Rate (₹)</Label>
                        <Input id="rate1" type="number" placeholder="0.00" />
                      </div>
                      <div className="col-span-2">
                        <Label>Amount (₹)</Label>
                        <Input value="0.00" disabled />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary">₹0.00</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Add any additional notes or payment instructions"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-primary">
                    <FileText className="size-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button type="button" variant="outline">
                    <Eye className="size-4 mr-2" />
                    Preview
                  </Button>
                  <Button type="button" variant="outline">
                    Save as Draft
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Report Configuration</CardTitle>
              <CardDescription>Select period and generate downloadable revenue reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Period Type</Label>
                  <Select 
                    value={reportPeriod.type} 
                    onValueChange={(value) => setReportPeriod({ ...reportPeriod, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select 
                    value={reportPeriod.year.toString()} 
                    onValueChange={(value) => setReportPeriod({ ...reportPeriod, year: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map(i => {
                        const year = new Date().getFullYear() - i;
                        return <SelectItem key={year} value={year.toString()}>{year}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {reportPeriod.type === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select 
                      value={reportPeriod.month.toString()} 
                      onValueChange={(value) => setReportPeriod({ ...reportPeriod, month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2000, month - 1).toLocaleDateString('en-US', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {reportPeriod.type === 'quarterly' && (
                  <div className="space-y-2">
                    <Label>Quarter</Label>
                    <Select 
                      value={reportPeriod.quarter.toString()} 
                      onValueChange={(value) => setReportPeriod({ ...reportPeriod, quarter: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => handleGenerateReport(reportPeriod.type)} 
                disabled={reportLoading}
                className="w-full sm:w-auto"
              >
                {reportLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Generate & Download Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Report Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleGenerateReport('monthly')}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="size-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Current Month Revenue</CardTitle>
                    <CardDescription>Download this month's revenue report</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled={reportLoading}>
                  <Download className="size-4 mr-2" />
                  Quick Download
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Receipt className="size-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Invoice Summary</CardTitle>
                    <CardDescription>Summary of all invoices by status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="size-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <CreditCard className="size-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Payment Report</CardTitle>
                    <CardDescription>Payment methods and transaction history</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="size-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <TrendingUp className="size-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Financial Analytics</CardTitle>
                    <CardDescription>Comprehensive financial performance metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="size-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Calendar className="size-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Monthly Statement</CardTitle>
                    <CardDescription>Month-wise financial statements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="size-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <AlertCircle className="size-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Outstanding Report</CardTitle>
                    <CardDescription>Pending and overdue payment tracking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="size-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Invoice Dialog */}
      <Dialog open={showNewInvoiceDialog} onOpenChange={setShowNewInvoiceDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Add a new invoice for a patient with itemized billing details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select
                value={invoiceFormData.patientId}
                onValueChange={(value) => {
                  setInvoiceFormData({ ...invoiceFormData, patientId: value });
                  if (invoiceErrors.patientId) {
                    const { patientId, ...rest } = invoiceErrors;
                    setInvoiceErrors(rest);
                  }
                }}
              >
                <SelectTrigger id="patient" className={invoiceErrors.patientId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {invoiceErrors.patientId && (
                <p className="text-sm text-red-500">{invoiceErrors.patientId}</p>
              )}
            </div>

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
                setShowNewInvoiceDialog(false);
                resetInvoiceForm();
              }}
              disabled={invoiceSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={invoiceSaving}>
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

      {/* Record Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for the selected invoice
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount (₹) *</Label>
              <Input
                id="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={paymentFormData.amount}
                onChange={(e) => {
                  setPaymentFormData({ ...paymentFormData, amount: e.target.value });
                  if (paymentErrors.amount) {
                    const { amount, ...rest } = paymentErrors;
                    setPaymentErrors(rest);
                  }
                }}
                className={paymentErrors.amount ? "border-red-500" : ""}
              />
              {paymentErrors.amount && (
                <p className="text-sm text-red-500">{paymentErrors.amount}</p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={paymentFormData.paymentMethod}
                onValueChange={(value) => {
                  setPaymentFormData({ ...paymentFormData, paymentMethod: value });
                  if (paymentErrors.paymentMethod) {
                    const { paymentMethod, ...rest } = paymentErrors;
                    setPaymentErrors(rest);
                  }
                }}
              >
                <SelectTrigger id="paymentMethod" className={paymentErrors.paymentMethod ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
              {paymentErrors.paymentMethod && (
                <p className="text-sm text-red-500">{paymentErrors.paymentMethod}</p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentFormData.paymentDate}
                onChange={(e) => {
                  setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value });
                  if (paymentErrors.paymentDate) {
                    const { paymentDate, ...rest } = paymentErrors;
                    setPaymentErrors(rest);
                  }
                }}
                className={paymentErrors.paymentDate ? "border-red-500" : ""}
              />
              {paymentErrors.paymentDate && (
                <p className="text-sm text-red-500">{paymentErrors.paymentDate}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any additional notes..."
                rows={3}
                value={paymentFormData.notes}
                onChange={(e) =>
                  setPaymentFormData({ ...paymentFormData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentDialog(false);
                resetPaymentForm();
              }}
              disabled={paymentSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={paymentSaving}>
              {paymentSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>Record Payment</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
    </TooltipProvider>
  );
}

