"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, FileText, PlusCircle, History, Loader2 } from "lucide-react";
import { appointmentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PatientQuickActionsProps {
  patientId: string;
  patientName: string;
}

export function PatientQuickActions({ patientId, patientName }: PatientQuickActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [appointmentData, setAppointmentData] = useState({
    date: "",
    time: "",
    type: "consultation",
    notes: "",
  });

  const handleScheduleAppointment = async () => {
    if (!appointmentData.date || !appointmentData.time) {
      toast({
        title: "Error",
        description: "Please select date and time",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await appointmentsAPI.create({
        patientId,
        date: new Date(appointmentData.date).toISOString(),
        time: appointmentData.time,
        type: appointmentData.type,
        status: "scheduled",
        notes: appointmentData.notes,
      });

      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });

      setShowAppointmentDialog(false);
      setAppointmentData({
        date: "",
        time: "",
        type: "consultation",
        notes: "",
      });

      // Refresh the page to show updated appointment count
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = () => {
    router.push(`/dashboard/finance?patientId=${patientId}`);
  };

  const handleAddTreatment = () => {
    router.push(`/dashboard/patients/${patientId}/add-treatment`);
  };

  const handleViewHistory = () => {
    // Scroll to treatments tab
    const treatmentsTab = document.querySelector('[value="treatments"]');
    if (treatmentsTab) {
      treatmentsTab.scrollIntoView({ behavior: "smooth", block: "start" });
      (treatmentsTab as HTMLElement).click();
    }
  };

  return (
    <>
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAppointmentDialog(true)}
                className="gap-2"
              >
                <Calendar className="size-4" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Schedule Appointment</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInvoice}
                className="gap-2"
              >
                <FileText className="size-4" />
                <span className="hidden sm:inline">Invoice</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate Invoice</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTreatment}
                className="gap-2"
              >
                <PlusCircle className="size-4" />
                <span className="hidden sm:inline">Treatment</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Treatment</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewHistory}
                className="gap-2"
              >
                <History className="size-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View History</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Schedule Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) =>
                    setAppointmentData({ ...appointmentData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) =>
                    setAppointmentData({ ...appointmentData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={appointmentData.type}
                onValueChange={(value) =>
                  setAppointmentData({ ...appointmentData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the appointment..."
                rows={3}
                value={appointmentData.notes}
                onChange={(e) =>
                  setAppointmentData({ ...appointmentData, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAppointmentDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleAppointment} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

