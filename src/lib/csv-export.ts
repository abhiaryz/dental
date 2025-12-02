/**
 * CSV Export Utility
 * Converts array of objects to CSV format and triggers download
 */

export function exportToCSV(data: any[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeader = headers.join(",");
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      
      // Convert to string
      let stringValue = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        stringValue = `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(",");
  });
  
  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join("\n");
  
  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export invoices to CSV format
 */
export function exportInvoicesToCSV(invoices: any[], filename: string = "invoices"): void {
  const formattedInvoices = invoices.map(invoice => ({
    "Invoice Number": invoice.invoiceNumber,
    "Patient Name": invoice.patientName,
    "Date": new Date(invoice.date).toLocaleDateString(),
    "Due Date": new Date(invoice.dueDate).toLocaleDateString(),
    "Amount": invoice.amount,
    "Status": invoice.status.toUpperCase(),
  }));
  
  exportToCSV(formattedInvoices, filename);
}

/**
 * Export payments to CSV format
 */
export function exportPaymentsToCSV(payments: any[], filename: string = "payments"): void {
  const formattedPayments = payments.map(payment => ({
    "Date": new Date(payment.date).toLocaleDateString(),
    "Patient Name": payment.patientName,
    "Invoice Number": payment.invoiceNumber,
    "Payment Method": payment.method,
    "Amount": payment.amount,
    "Status": payment.status.toUpperCase(),
  }));
  
  exportToCSV(formattedPayments, filename);
}

/**
 * Export patients to CSV format
 */
export function exportPatientsToCSV(patients: any[], filename: string = "patients"): void {
  const formattedPatients = patients.map(patient => ({
    "Patient ID": patient.id,
    "First Name": patient.firstName,
    "Last Name": patient.lastName,
    "Date of Birth": new Date(patient.dateOfBirth).toLocaleDateString(),
    "Gender": patient.gender,
    "Mobile Number": patient.mobileNumber,
    "Email": patient.email || "",
    "City": patient.city,
    "State": patient.state,
  }));
  
  exportToCSV(formattedPatients, filename);
}

/**
 * Export treatments to CSV format
 */
export function exportTreatmentsToCSV(treatments: any[], filename: string = "treatments"): void {
  const formattedTreatments = treatments.map(treatment => ({
    "Treatment ID": treatment.id,
    "Patient Name": `${treatment.patient?.firstName || ""} ${treatment.patient?.lastName || ""}`.trim(),
    "Date": new Date(treatment.treatmentDate).toLocaleDateString(),
    "Chief Complaint": treatment.chiefComplaint,
    "Diagnosis": treatment.diagnosis,
    "Cost": treatment.cost,
    "Paid Amount": treatment.paidAmount,
    "Balance": treatment.cost - treatment.paidAmount,
  }));
  
  exportToCSV(formattedTreatments, filename);
}

/**
 * Export revenue report to CSV format
 */
export function exportRevenueReportToCSV(report: any, filename: string = "revenue-report"): void {
  // Create summary section
  const summary = [
    ["Revenue Report", report.period.label],
    ["Period", `${new Date(report.period.startDate).toLocaleDateString()} - ${new Date(report.period.endDate).toLocaleDateString()}`],
    [""],
    ["Summary Statistics"],
    ["Total Revenue", `₹${report.summary.totalRevenue.toLocaleString()}`],
    ["Total Paid", `₹${report.summary.totalPaid.toLocaleString()}`],
    ["Total Pending", `₹${report.summary.totalPending.toLocaleString()}`],
    ["Invoice Count", report.summary.invoiceCount],
    ["Treatment Count", report.summary.treatmentCount],
    ["Average Invoice Value", `₹${report.summary.averageInvoiceValue.toFixed(2)}`],
    [""],
    ["Invoices by Status"],
    ["Paid", report.invoicesByStatus.paid],
    ["Pending", report.invoicesByStatus.pending],
    ["Overdue", report.invoicesByStatus.overdue],
    [""],
  ];

  // Add monthly breakdown if available
  if (report.monthlyBreakdown && report.monthlyBreakdown.length > 0) {
    summary.push(["Monthly Breakdown"]);
    summary.push(["Month", "Revenue", "Paid"]);
    report.monthlyBreakdown.forEach((month: any) => {
      summary.push([month.month, `₹${month.revenue.toLocaleString()}`, `₹${month.paid.toLocaleString()}`]);
    });
    summary.push([""]);
  }

  // Add detailed invoices
  summary.push(["Detailed Invoices"]);
  summary.push(["Invoice Number", "Date", "Patient Name", "Amount", "Paid", "Status"]);
  report.invoices.forEach((invoice: any) => {
    summary.push([
      invoice.invoiceNumber,
      new Date(invoice.date).toLocaleDateString(),
      invoice.patientName,
      `₹${invoice.amount.toLocaleString()}`,
      `₹${invoice.paid.toLocaleString()}`,
      invoice.status
    ]);
  });

  // Convert to CSV
  const csvContent = summary.map(row => 
    row.map(cell => {
      const stringValue = String(cell);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",")
  ).join("\n");

  // Trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

