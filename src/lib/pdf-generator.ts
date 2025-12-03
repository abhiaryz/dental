import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Clinic Information
const CLINIC_INFO = {
  name: "MediCare Dental Clinic",
  address: "123, MG Road, Bangalore, Karnataka - 560001",
  phone: "+91 80 1234 5678",
  email: "info@medicaredental.com",
  website: "www.medicaredental.com",
  registrationNo: "KA/BLR/DC/2020/12345",
};

interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

interface TreatmentData {
  id: string;
  treatmentDate: string;
  treatmentType: string;
  doctor: string;
  doctorQualification?: string;
  doctorRegistration?: string;
  chiefComplaint: string;
  diagnosis: string;
  xrayFindings?: string;
  treatmentPlan: string;
  medications: string;
  instructions: string;
  affectedTeeth?: string[];
  followupDate?: string;
  followupNotes?: string;
}

interface MedicalHistory {
  conditions?: string[];
  allergies?: string;
  medications?: string;
  previousSurgeries?: string;
}

export const generatePrescriptionPDF = (
  patient: PatientData,
  treatment: TreatmentData,
  medicalHistory?: MedicalHistory
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Color palette
  const colors = {
    primary: [0, 128, 96] as [number, number, number],
    secondary: [6, 178, 172] as [number, number, number],
    accent: [104, 187, 108] as [number, number, number],
    text: [51, 51, 51] as [number, number, number],
    lightGray: [240, 240, 240] as [number, number, number],
    mediumGray: [200, 200, 200] as [number, number, number],
    darkGray: [115, 115, 115] as [number, number, number],
  };

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number = 170) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 7);
  };

  // Helper function to draw a rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' = 'S') => {
    doc.roundedRect(x, y, w, h, r, r, style);
  };

  // =========================
  // Modern Header with Gradient Effect
  // =========================
  // Main header background
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 45, "F");
  
  // Accent stripe
  doc.setFillColor(...colors.secondary);
  doc.rect(0, 40, 210, 5, "F");
  
  // Decorative corner elements
  doc.setFillColor(255, 255, 255, 0.1);
  doc.circle(195, 10, 15, "F");
  doc.circle(15, 35, 12, "F");
  
  // Clinic Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_INFO.name, 105, 15, { align: "center" });
  
  // Clinic Details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(CLINIC_INFO.address, 105, 22, { align: "center" });
  
  doc.setFontSize(8);
  doc.text(`Phone: ${CLINIC_INFO.phone}  |  Email: ${CLINIC_INFO.email}  |  Web: ${CLINIC_INFO.website}`, 105, 27, { align: "center" });
  doc.text(`Registration No: ${CLINIC_INFO.registrationNo}`, 105, 32, { align: "center" });
  
  doc.setTextColor(...colors.text);
  yPosition = 55;

  // =========================
  // Modern Document Title Badge
  // =========================
  doc.setFillColor(...colors.lightGray);
  drawRoundedRect(35, yPosition - 3, 140, 12, 3, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("MEDICAL PRESCRIPTION & TREATMENT REPORT", 105, yPosition + 5, { align: "center" });
  yPosition += 18;

  // Modern Info Cards
  doc.setTextColor(...colors.text);
  
  // Date card
  doc.setFillColor(...colors.lightGray);
  drawRoundedRect(15, yPosition - 3, 85, 10, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 18, yPosition + 3);
  doc.setFont("helvetica", "normal");
  doc.text(treatment.treatmentDate, 32, yPosition + 3);
  
  // Treatment ID card
  drawRoundedRect(110, yPosition - 3, 85, 10, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Treatment ID:", 113, yPosition + 3);
  doc.setFont("helvetica", "normal");
  doc.text(treatment.id, 145, yPosition + 3);
  
  yPosition += 15;

  // =========================
  // Modern Patient Information Card
  // =========================
  doc.setFillColor(...colors.primary);
  drawRoundedRect(15, yPosition, 180, 8, 2, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PATIENT INFORMATION", 18, yPosition + 5.5);
  yPosition += 13;

  // Patient info box with border
  doc.setDrawColor(...colors.mediumGray);
  doc.setLineWidth(0.5);
  drawRoundedRect(15, yPosition, 180, 35, 3, "S");
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  yPosition += 6;
  
  const patientInfo = [
    ["Name:", `${patient.firstName} ${patient.lastName}`],
    ["Patient ID:", patient.id],
    ["Age / Gender:", `${patient.age} years / ${patient.gender}`],
    ["Contact:", patient.phone],
    ["Address:", `${patient.address}, ${patient.city}, ${patient.state} - ${patient.pinCode}`],
  ];

  patientInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.primary);
    doc.text(label, 18, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.text);
    yPosition = addText(value, 50, yPosition, 143);
    yPosition += 1;
  });

  yPosition += 8;

  // =========================
  // Medical History (if provided)
  // =========================
  if (medicalHistory) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICAL HISTORY", 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    if (medicalHistory.conditions && medicalHistory.conditions.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Medical Conditions:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition = addText(medicalHistory.conditions.join(", "), 55, yPosition, 140);
      yPosition += 2;
    }

    if (medicalHistory.allergies) {
      doc.setFont("helvetica", "bold");
      doc.text("Allergies:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition = addText(medicalHistory.allergies, 55, yPosition, 140);
      yPosition += 2;
    }

    if (medicalHistory.medications) {
      doc.setFont("helvetica", "bold");
      doc.text("Current Medications:", 15, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition = addText(medicalHistory.medications, 55, yPosition, 140);
      yPosition += 2;
    }

    yPosition += 3;
    doc.line(15, yPosition, 195, yPosition);
    yPosition += 8;
  }

  // =========================
  // Chief Complaint
  // =========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CHIEF COMPLAINT", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  yPosition = addText(treatment.chiefComplaint, 15, yPosition);
  yPosition += 5;

  // =========================
  // Clinical Findings & Diagnosis
  // =========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CLINICAL FINDINGS & DIAGNOSIS", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (treatment.affectedTeeth && treatment.affectedTeeth.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Affected Teeth:", 15, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(treatment.affectedTeeth.join(", "), 50, yPosition);
    yPosition += 7;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Diagnosis:", 15, yPosition);
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  yPosition = addText(treatment.diagnosis, 15, yPosition);
  yPosition += 5;

  if (treatment.xrayFindings) {
    doc.setFont("helvetica", "bold");
    doc.text("X-ray Findings:", 15, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    yPosition = addText(treatment.xrayFindings, 15, yPosition);
    yPosition += 5;
  }

  // Check if we need a new page
  if (yPosition > 240) {
    doc.addPage();
    yPosition = 20;
  }

  // =========================
  // Treatment Plan
  // =========================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TREATMENT PROVIDED", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Treatment Type:", 15, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(treatment.treatmentType, 55, yPosition);
  yPosition += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Procedure:", 15, yPosition);
  yPosition += 5;
  doc.setFont("helvetica", "normal");
  yPosition = addText(treatment.treatmentPlan, 15, yPosition);
  yPosition += 8;

  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  // =========================
  // Modern Prescription (Rx) Section
  // =========================
  doc.setFillColor(...colors.secondary);
  drawRoundedRect(15, yPosition, 180, 8, 2, "F");
  
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Rx  PRESCRIPTION", 18, yPosition + 5.5);
  yPosition += 13;

  // Prescription box with gradient-like border
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.8);
  drawRoundedRect(15, yPosition, 180, 0, 3, "S");
  
  doc.setFillColor(252, 255, 253);
  drawRoundedRect(15, yPosition, 180, 0, 3, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  yPosition += 6;
  
  const medicationLines = treatment.medications.split("\n");
  let lineCount = 0;
  medicationLines.forEach((line) => {
    if (line.trim()) {
      // Add bullet points
      doc.setFillColor(...colors.secondary);
      doc.circle(20, yPosition - 1.5, 1, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.text);
      yPosition = addText(line, 25, yPosition, 165);
      yPosition += 3;
      lineCount++;
    }
  });

  // Adjust the prescription box height
  const prescriptionHeight = (lineCount * 7) + 12;
  doc.setDrawColor(...colors.secondary);
  doc.setLineWidth(0.8);
  drawRoundedRect(15, yPosition - prescriptionHeight, 180, prescriptionHeight, 3, "S");

  yPosition += 3;

  // =========================
  // Instructions
  // =========================
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("POST-TREATMENT INSTRUCTIONS", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const instructionLines = treatment.instructions.split("\n");
  instructionLines.forEach((line) => {
    if (line.trim()) {
      // Check if we need a new page
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      yPosition = addText(line, 15, yPosition);
      yPosition += 3;
    }
  });

  yPosition += 8;

  // =========================
  // Follow-up
  // =========================
  if (treatment.followupDate) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FOLLOW-UP APPOINTMENT", 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${treatment.followupDate}`, 15, yPosition);
    yPosition += 5;
    
    if (treatment.followupNotes) {
      yPosition = addText(`Notes: ${treatment.followupNotes}`, 15, yPosition);
      yPosition += 5;
    }
  }

  // =========================
  // Modern Doctor's Signature Section
  // =========================
  // Check if we need a new page for signature
  if (yPosition > 245) {
    doc.addPage();
    yPosition = 20;
  } else {
    yPosition = Math.max(yPosition + 15, 245);
  }

  // Signature card
  doc.setFillColor(...colors.lightGray);
  drawRoundedRect(120, yPosition, 75, 35, 3, "F");
  
  yPosition += 8;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(treatment.doctor, 157.5, yPosition, { align: "center" });
  yPosition += 5;
  
  if (treatment.doctorQualification) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkGray);
    doc.text(treatment.doctorQualification, 157.5, yPosition, { align: "center" });
    yPosition += 4;
  }
  
  if (treatment.doctorRegistration) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Reg. No: ${treatment.doctorRegistration}`, 157.5, yPosition, { align: "center" });
    yPosition += 5;
  }

  // Signature line
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(125, yPosition, 190, yPosition);
  yPosition += 4;
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...colors.darkGray);
  doc.text("(Doctor's Signature)", 157.5, yPosition, { align: "center" });

  // =========================
  // Footer
  // =========================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | This is a computer-generated prescription`,
      105,
      290,
      { align: "center" }
    );
  }

  // Return the doc object for server-side or save for client-side
  return doc;
};

export const generateTreatmentReportPDF = (
  patient: PatientData,
  treatments: TreatmentData[],
  medicalHistory?: MedicalHistory
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFillColor(0, 128, 96);
  doc.rect(0, 0, 210, 35, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_INFO.name, 105, 12, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(CLINIC_INFO.address, 105, 18, { align: "center" });
  doc.text(`Phone: ${CLINIC_INFO.phone} | Email: ${CLINIC_INFO.email}`, 105, 23, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  yPosition = 45;

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TREATMENT HISTORY REPORT", 105, yPosition, { align: "center" });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, yPosition);
  yPosition += 8;

  // Patient Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PATIENT INFORMATION", 15, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${patient.firstName} ${patient.lastName} | ${patient.age}yrs | ${patient.gender}`, 15, yPosition);
  yPosition += 5;
  doc.text(`ID: ${patient.id} | Contact: ${patient.phone}`, 15, yPosition);
  yPosition += 10;

  // Treatment History Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TREATMENT HISTORY", 15, yPosition);
  yPosition += 7;

  // Optional Medical History Summary (if provided)
  if (medicalHistory) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICAL HISTORY", 15, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (medicalHistory.conditions && medicalHistory.conditions.length > 0) {
      doc.text(`Conditions: ${medicalHistory.conditions.join(", ")}`, 15, yPosition);
      yPosition += 4;
    }

    if (medicalHistory.allergies) {
      doc.text(`Allergies: ${medicalHistory.allergies}`, 15, yPosition);
      yPosition += 4;
    }

    if (medicalHistory.medications) {
      doc.text(`Medications: ${medicalHistory.medications}`, 15, yPosition);
      yPosition += 4;
    }

    if (medicalHistory.previousSurgeries) {
      doc.text(`Previous Surgeries: ${medicalHistory.previousSurgeries}`, 15, yPosition);
      yPosition += 4;
    }

    yPosition += 4;
  }

  const tableData = treatments.map((t) => [
    t.treatmentDate,
    t.treatmentType,
    t.doctor,
    t.affectedTeeth?.join(", ") || "N/A",
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Date", "Treatment", "Doctor", "Teeth"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [0, 128, 96] },
    margin: { left: 15, right: 15 },
  });

  // Return the doc object for server-side or save for client-side
  return doc;
};

export const generateInvoicePDF = (
  patient: PatientData,
  treatment: TreatmentData & {
    treatmentCost: string;
    amountPaid: string;
    balanceAmount: string;
    paymentMode: string;
    paymentStatus: string;
    receiptNumber: string;
    materialsUsed?: string;
  }
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Color palette
  const colors = {
    primary: [0, 128, 96] as [number, number, number],
    secondary: [6, 178, 172] as [number, number, number],
    accent: [104, 187, 108] as [number, number, number],
    text: [51, 51, 51] as [number, number, number],
    lightGray: [240, 240, 240] as [number, number, number],
    mediumGray: [200, 200, 200] as [number, number, number],
    darkGray: [115, 115, 115] as [number, number, number],
  };

  // Helper function to draw a rounded rectangle
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' = 'S') => {
    doc.roundedRect(x, y, w, h, r, r, style);
  };

  // =========================
  // Modern Header
  // =========================
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 210, 45, "F");
  
  doc.setFillColor(...colors.secondary);
  doc.rect(0, 40, 210, 5, "F");
  
  // Decorative corner elements
  doc.setFillColor(255, 255, 255, 0.1);
  doc.circle(195, 10, 15, "F");
  doc.circle(15, 35, 12, "F");
  
  // Clinic Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(CLINIC_INFO.name, 105, 15, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(CLINIC_INFO.address, 105, 22, { align: "center" });
  
  doc.setFontSize(8);
  doc.text(`Phone: ${CLINIC_INFO.phone}  |  Email: ${CLINIC_INFO.email}  |  Web: ${CLINIC_INFO.website}`, 105, 27, { align: "center" });
  doc.text(`Registration No: ${CLINIC_INFO.registrationNo}`, 105, 32, { align: "center" });
  
  doc.setTextColor(...colors.text);
  yPosition = 55;

  // =========================
  // Invoice Title
  // =========================
  doc.setFillColor(...colors.lightGray);
  drawRoundedRect(60, yPosition - 3, 90, 12, 3, "F");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("INVOICE", 105, yPosition + 5, { align: "center" });
  yPosition += 18;

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.text);
  doc.text("Invoice No:", 15, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(treatment.receiptNumber || treatment.id, 45, yPosition);
  
  doc.setFont("helvetica", "bold");
  doc.text("Date:", 120, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(treatment.treatmentDate, 135, yPosition);
  yPosition += 10;

  // =========================
  // Bill To Section
  // =========================
  doc.setFillColor(...colors.primary);
  drawRoundedRect(15, yPosition, 85, 8, 2, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("BILL TO", 18, yPosition + 5.5);
  yPosition += 13;

  doc.setDrawColor(...colors.mediumGray);
  doc.setLineWidth(0.5);
  drawRoundedRect(15, yPosition, 85, 30, 3, "S");
  
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  yPosition += 6;
  
  doc.setFont("helvetica", "bold");
  doc.text(`${patient.firstName} ${patient.lastName}`, 18, yPosition);
  yPosition += 5;
  
  doc.setFont("helvetica", "normal");
  doc.text(`Patient ID: ${patient.id}`, 18, yPosition);
  yPosition += 5;
  doc.text(patient.phone, 18, yPosition);
  yPosition += 5;
  doc.text(`${patient.city}, ${patient.state}`, 18, yPosition);
  yPosition += 5;
  doc.text(patient.pinCode, 18, yPosition);
  
  // Treatment Details Box
  yPosition = 108;
  doc.setFillColor(...colors.secondary);
  drawRoundedRect(110, yPosition, 85, 8, 2, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TREATMENT DETAILS", 113, yPosition + 5.5);
  yPosition += 13;

  doc.setDrawColor(...colors.mediumGray);
  drawRoundedRect(110, yPosition, 85, 30, 3, "S");
  
  doc.setTextColor(...colors.text);
  yPosition += 6;
  
  doc.setFont("helvetica", "normal");
  doc.text(`Type: ${treatment.treatmentType}`, 113, yPosition);
  yPosition += 5;
  doc.text(`Doctor: ${treatment.doctor}`, 113, yPosition);
  yPosition += 5;
  if (treatment.affectedTeeth && treatment.affectedTeeth.length > 0) {
    doc.text(`Teeth: ${treatment.affectedTeeth.join(", ")}`, 113, yPosition);
    yPosition += 5;
  }
  doc.text(`Treatment ID: ${treatment.id}`, 113, yPosition);
  
  yPosition = 155;

  // =========================
  // Services Table
  // =========================
  doc.setFillColor(...colors.primary);
  doc.rect(15, yPosition, 180, 10, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DESCRIPTION", 20, yPosition + 6.5);
  doc.text("AMOUNT (Rs)", 155, yPosition + 6.5);
  yPosition += 15;

  // Service Items
  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(...colors.mediumGray);
  doc.line(15, yPosition - 5, 195, yPosition - 5);
  
  doc.text(treatment.treatmentType, 20, yPosition);
  doc.text(parseInt(treatment.treatmentCost).toLocaleString(), 165, yPosition, { align: "right" });
  yPosition += 8;

  doc.line(15, yPosition - 3, 195, yPosition - 3);
  yPosition += 5;

  // =========================
  // Totals Section
  // =========================
  // Subtotal
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", 130, yPosition);
  doc.text(`Rs ${parseInt(treatment.treatmentCost).toLocaleString()}`, 165, yPosition, { align: "right" });
  yPosition += 7;

  // Discount (if any)
  doc.setFont("helvetica", "normal");
  doc.text("Discount:", 130, yPosition);
  doc.text("Rs 0", 165, yPosition, { align: "right" });
  yPosition += 10;

  // Total (highlighted)
  doc.setFillColor(...colors.lightGray);
  doc.rect(110, yPosition - 5, 85, 10, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("TOTAL:", 130, yPosition + 2);
  doc.text(`Rs ${parseInt(treatment.treatmentCost).toLocaleString()}`, 165, yPosition + 2, { align: "right" });
  yPosition += 15;

  // Amount Paid
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  doc.text("Amount Paid:", 130, yPosition);
  doc.setTextColor(...colors.accent);
  doc.text(`Rs ${parseInt(treatment.amountPaid).toLocaleString()}`, 165, yPosition, { align: "right" });
  yPosition += 7;

  // Balance
  doc.setTextColor(...colors.text);
  doc.text("Balance Due:", 130, yPosition);
  const balance = parseInt(treatment.balanceAmount);
  if (balance > 0) {
    doc.setTextColor(239, 68, 68); // Red color for pending balance
  } else {
    doc.setTextColor(...colors.accent); // Green color for fully paid
  }
  doc.text(`Rs ${balance.toLocaleString()}`, 165, yPosition, { align: "right" });
  yPosition += 15;

  // =========================
  // Payment Info
  // =========================
  doc.setFillColor(...colors.lightGray);
  drawRoundedRect(15, yPosition, 85, 25, 3, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("PAYMENT INFORMATION", 18, yPosition + 6);
  yPosition += 11;
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.text);
  doc.text(`Payment Mode: ${treatment.paymentMode}`, 18, yPosition);
  yPosition += 5;
  doc.text(`Status: ${treatment.paymentStatus}`, 18, yPosition);
  
  // =========================
  // Terms & Conditions
  // =========================
  yPosition = 245;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.darkGray);
  doc.text("Terms & Conditions:", 15, yPosition);
  yPosition += 5;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("1. Payment is due at the time of service unless other arrangements have been made.", 15, yPosition);
  yPosition += 4;
  doc.text("2. For any queries regarding this invoice, please contact us within 7 days.", 15, yPosition);
  yPosition += 4;
  doc.text("3. This invoice is computer-generated and is valid without signature.", 15, yPosition);

  // =========================
  // Footer
  // =========================
  yPosition = 280;
  doc.setFillColor(...colors.primary);
  doc.rect(0, yPosition, 210, 17, "F");
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Thank you for choosing " + CLINIC_INFO.name + "!", 105, yPosition + 6, { align: "center" });
  doc.setFontSize(8);
  doc.text("For support: " + CLINIC_INFO.email + " | " + CLINIC_INFO.phone, 105, yPosition + 11, { align: "center" });

  // Return the doc object for server-side or save for client-side
  return doc;
};

