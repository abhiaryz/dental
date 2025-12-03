"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, Calendar, Clock, XCircle, CheckCircle2, TrendingUp, Loader2, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { appointmentsAPI, patientsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
  };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    date: "",
    time: "",
    type: "consultation",
    status: "scheduled",
    notes: "",
  });

  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentsAPI.getAll();
      setAppointments(data.appointments || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientsAPI.getAll({ limit: 1000 });
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
    void fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const handleCreate = async () => {
    if (!formData.patientId || !formData.date || !formData.time || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      await appointmentsAPI.create({
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      
      setShowCreateDialog(false);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.patientId || !formData.date || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const appointmentId = (showEditDialog as any).id;
      
      await appointmentsAPI.update(appointmentId, {
        ...formData,
        date: new Date(formData.date).toISOString(),
      });
      
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      
      setShowEditDialog(false);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await appointmentsAPI.delete(deleteId);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setFormData({
      patientId: appointment.patientId,
      date: appointment.date.split("T")[0],
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes || "",
    });
    setShowEditDialog(appointment as any);
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      date: "",
      time: "",
      type: "consultation",
      status: "scheduled",
      notes: "",
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.date) >= today && apt.status !== "cancelled"
  );

  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.date) < today || apt.status === "completed"
  );

  const todayAppointments = appointments.filter(
    (apt) => new Date(apt.date).toDateString() === today.toDateString()
  );

  const thisWeekAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return aptDate >= weekStart && aptDate < weekEnd;
  });

  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled");

  // Calendar functions
  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(
      (apt) => new Date(apt.date).toDateString() === date.toDateString()
    );
  };

  const goToNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const goToPreviousWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Calendar className="size-6 sm:size-8 text-primary shrink-0" />
            <span>Appointments</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Schedule and manage appointments
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all min-touch"
        >
          <CalendarPlus className="mr-2 size-4" />
          New Appointment
        </Button>
      </div>

      <div className="relative -mx-4 sm:mx-0">
        <div className="overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
          <div className="grid grid-flow-col auto-cols-[280px] sm:auto-cols-auto sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="size-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{todayAppointments.length}</div>
                <Badge className="mt-2 bg-accent text-accent-foreground">
                  {todayAppointments.filter((apt) => apt.status === "scheduled").length} scheduled
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-accent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Calendar className="size-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{thisWeekAppointments.length}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-success text-success-foreground gap-1">
                    <TrendingUp className="size-3" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <XCircle className="size-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{cancelledAppointments.length}</div>
                <Badge variant="secondary" className="mt-2">Total</Badge>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle2 className="size-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{upcomingAppointments.length}</div>
                <Badge className="mt-2 bg-primary text-white">Scheduled</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <div className="relative -mx-4 sm:mx-0">
          <div className="overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
            <TabsList className="inline-flex sm:w-full justify-start gap-2 rounded-2xl bg-white/80 p-2 shadow-md min-w-max">
              <TabsTrigger value="calendar" className="px-3 sm:px-4 py-2">Calendar View</TabsTrigger>
              <TabsTrigger value="upcoming" className="px-3 sm:px-4 py-2">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="px-3 sm:px-4 py-2">Past</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Calendar</CardTitle>
                  <CardDescription>
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="min-touch">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} className="min-touch">
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextWeek} className="min-touch">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {getWeekDays().map((day, index) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 min-h-[150px] ${
                          isToday ? "bg-primary/5 border-primary" : ""
                        }`}
                      >
                        <div className="text-center mb-2 flex justify-between sm:block items-center">
                          <div className="text-xs text-muted-foreground">
                            {day.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                            {day.getDate()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="text-xs p-2 rounded bg-muted hover:bg-muted/80 cursor-pointer active:scale-95 transition-transform"
                              onClick={() => openEditDialog(apt)}
                            >
                              <div className="font-medium truncate">
                                {apt.time}
                              </div>
                              <div className="truncate text-muted-foreground">
                                {apt.patient.firstName} {apt.patient.lastName}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Appointments scheduled for today and beyond</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="p-6">
                  <SkeletonTable />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming appointments"
                  description="You don't have any upcoming appointments scheduled."
                  action={{
                    label: "Schedule Appointment",
                    onClick: () => setShowCreateDialog(true),
                    icon: CalendarPlus
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Time</TableHead>
                        <TableHead className="whitespace-nowrap">Patient</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="whitespace-nowrap">{new Date(appointment.date).toLocaleDateString()}</TableCell>
                          <TableCell className="whitespace-nowrap">{appointment.time}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap">{appointment.type}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(appointment)}
                                className="min-touch"
                              >
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(appointment.id)}
                                className="min-touch"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
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

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>Historical appointment records</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="p-6">
                  <SkeletonTable />
                </div>
              ) : pastAppointments.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No past appointments"
                  description="You don't have any past appointments."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Time</TableHead>
                        <TableHead className="whitespace-nowrap">Patient</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="whitespace-nowrap">{new Date(appointment.date).toLocaleDateString()}</TableCell>
                          <TableCell className="whitespace-nowrap">{appointment.time}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap">{appointment.type}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary">{appointment.status}</Badge>
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
      </Tabs>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>Schedule a new appointment for a patient</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                  <SelectTrigger className="min-touch">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id} className="min-touch">
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="min-touch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation" className="min-touch">Consultation</SelectItem>
                    <SelectItem value="checkup" className="min-touch">Checkup</SelectItem>
                    <SelectItem value="treatment" className="min-touch">Treatment</SelectItem>
                    <SelectItem value="follow-up" className="min-touch">Follow-up</SelectItem>
                    <SelectItem value="emergency" className="min-touch">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="min-touch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled" className="min-touch">Scheduled</SelectItem>
                  <SelectItem value="confirmed" className="min-touch">Confirmed</SelectItem>
                  <SelectItem value="completed" className="min-touch">Completed</SelectItem>
                  <SelectItem value="cancelled" className="min-touch">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes about the appointment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[100px]"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="min-touch">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="min-touch">
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open ? showEditDialog : false);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                  <SelectTrigger className="min-touch">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id} className="min-touch">
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="min-touch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation" className="min-touch">Consultation</SelectItem>
                    <SelectItem value="checkup" className="min-touch">Checkup</SelectItem>
                    <SelectItem value="treatment" className="min-touch">Treatment</SelectItem>
                    <SelectItem value="follow-up" className="min-touch">Follow-up</SelectItem>
                    <SelectItem value="emergency" className="min-touch">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="min-touch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled" className="min-touch">Scheduled</SelectItem>
                  <SelectItem value="confirmed" className="min-touch">Confirmed</SelectItem>
                  <SelectItem value="completed" className="min-touch">Completed</SelectItem>
                  <SelectItem value="cancelled" className="min-touch">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes about the appointment..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[100px]"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="min-touch">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving} className="min-touch">
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the appointment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="min-touch">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground min-touch">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
