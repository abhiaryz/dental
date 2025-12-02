"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, UserPlus, Mail, Loader2, Trash2, Edit, Clock, CheckCircle2, XCircle } from "lucide-react";
import { employeesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"employee" | "invitation">("employee");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmails, setInviteEmails] = useState([{ email: "", role: "CLINIC_DOCTOR" }]);
  const [sending, setSending] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeesAPI.getAll();
      setEmployees(data.employees || []);
      setInvitations(data.invitations || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      if (deleteType === "employee") {
        await employeesAPI.delete(deleteId);
        toast({
          title: "Success",
          description: "Employee removed successfully",
        });
      } else {
        await employeesAPI.cancelInvitation(deleteId);
        toast({
          title: "Success",
          description: "Invitation cancelled successfully",
        });
      }
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleUpdateRole = async () => {
    if (!editEmployee) return;

    try {
      await employeesAPI.update(editEmployee.id, {
        role: editEmployee.role,
        name: editEmployee.name,
      });
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      setEditEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    }
  };

  const handleSendInvitations = async () => {
    const validInvites = inviteEmails.filter((inv) => inv.email && inv.role);
    
    if (validInvites.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one valid email and role",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const result = await employeesAPI.sendInvitations(validInvites);
      
      toast({
        title: "Invitations Sent",
        description: `Successfully sent ${result.results.sent.length} invitation(s)`,
      });
      
      if (result.results.failed.length > 0) {
        toast({
          title: "Some invitations failed",
          description: result.results.failed.map((f: any) => `${f.email}: ${f.error}`).join(", "),
          variant: "destructive",
        });
      }
      
      setShowInviteDialog(false);
      setInviteEmails([{ email: "", role: "CLINIC_DOCTOR" }]);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const addInviteField = () => {
    setInviteEmails([...inviteEmails, { email: "", role: "CLINIC_DOCTOR" }]);
  };

  const removeInviteField = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index));
  };

  const updateInviteField = (index: number, field: "email" | "role", value: string) => {
    const updated = [...inviteEmails];
    updated[index][field] = value;
    setInviteEmails(updated);
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
      CLINIC_DOCTOR: "bg-blue-100 text-blue-800 border-blue-200",
      HYGIENIST: "bg-green-100 text-green-800 border-green-200",
      RECEPTIONIST: "bg-yellow-100 text-yellow-800 border-yellow-200",
      EXTERNAL_DOCTOR: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const roleNames: Record<string, string> = {
      ADMIN: "Admin",
      CLINIC_DOCTOR: "Doctor",
      HYGIENIST: "Hygienist",
      RECEPTIONIST: "Receptionist",
      EXTERNAL_DOCTOR: "External Doctor",
    };

    return (
      <Badge variant="outline" className={roleColors[role] || ""}>
        {roleNames[role] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="size-8 text-primary" />
            Employee Management
          </h1>
          <p className="text-muted-foreground">Manage clinic staff and their roles</p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="mr-2 size-4" />
          Invite Employees
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Active staff members</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Invitations
            </CardTitle>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Mail className="size-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invitations.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {employees.filter(emp => 
                emp.lastLoginAt && 
                new Date(emp.lastLoginAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Logged in today</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Active Employees</CardTitle>
          <CardDescription>Manage employee roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No employees yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Invite your first team member to get started
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell className="font-mono text-sm">{employee.username}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell>
                        {employee.lastLoginAt
                          ? new Date(employee.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditEmployee(employee)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteId(employee.id);
                              setDeleteType("employee");
                            }}
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

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations waiting for acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                      <TableCell>
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-muted-foreground" />
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteId(invitation.id);
                            setDeleteType("invitation");
                          }}
                        >
                          <XCircle className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Employees</DialogTitle>
            <DialogDescription>
              Send invitation emails to new team members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {inviteEmails.map((invite, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="employee@example.com"
                    value={invite.email}
                    onChange={(e) => updateInviteField(index, "email", e.target.value)}
                  />
                </div>
                <div className="w-48 space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={invite.role}
                    onValueChange={(value) => updateInviteField(index, "role", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLINIC_DOCTOR">Doctor</SelectItem>
                      <SelectItem value="HYGIENIST">Hygienist</SelectItem>
                      <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {inviteEmails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInviteField(index)}
                    className="mt-8"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addInviteField} className="w-full">
              <UserPlus className="size-4 mr-2" />
              Add Another
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvitations} disabled={sending}>
              {sending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details and role</DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editEmployee.name}
                  onChange={(e) =>
                    setEditEmployee({ ...editEmployee, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editEmployee.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editEmployee.role}
                  onValueChange={(value) =>
                    setEditEmployee({ ...editEmployee, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLINIC_DOCTOR">Doctor</SelectItem>
                    <SelectItem value="HYGIENIST">Hygienist</SelectItem>
                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === "employee" ? "Remove Employee?" : "Cancel Invitation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "employee"
                ? "This will permanently remove the employee from your clinic. This action cannot be undone."
                : "This will cancel the pending invitation. You can send a new invitation later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteType === "employee" ? "Remove" : "Cancel Invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

