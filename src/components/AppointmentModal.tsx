import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type AppointmentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AppointmentModal({ open, onOpenChange }: AppointmentModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [datetime, setDatetime] = useState("");
  const [problem, setProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !datetime.trim()) {
      toast({ title: "Missing required fields", description: "Please fill Name, Phone, and Date/Time." });
      return;
    }
    setSubmitting(true);
    try {
      // Simulate submission; wire to API or email in future
      await new Promise((r) => setTimeout(r, 800));
      toast({ title: "Appointment request received", description: "Our team will contact you shortly." });
      onOpenChange(false);
      setName("");
      setPhone("");
      setDatetime("");
      setProblem("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Fill in your details and preferred time. Our team will contact you shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="appt-name">Name</label>
            <Input id="appt-name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="appt-phone">Phone Number</label>
            <Input id="appt-phone" placeholder="e.g. 9999 354-083" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="appt-datetime">Appointment Date & Time</label>
            <Input id="appt-datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="appt-problem">Problem Description (optional)</label>
            <Textarea id="appt-problem" placeholder="Briefly describe your concern" value={problem} onChange={(e) => setProblem(e.target.value)} />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="cta" disabled={submitting} className="shadow-button">
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


