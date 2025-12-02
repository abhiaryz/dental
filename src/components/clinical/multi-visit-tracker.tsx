"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, CheckCircle, Clock, XCircle, IndianRupee, Loader2, Edit, Trash2 } from "lucide-react";
import { treatmentVisitsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MultiVisitTrackerProps {
  treatmentId: string;
}

export function MultiVisitTracker({ treatmentId }: MultiVisitTrackerProps) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [visitData, setVisitData] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    status: "COMPLETED",
    notes: "",
    procedures: "",
    cost: "",
    duration: "",
    isBilled: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchVisits();
  }, [treatmentId]);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await treatmentVisitsAPI.getByTreatment(treatmentId);
      setVisits(response.visits || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch visits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisit = async () => {
    if (!visitData.visitDate) {
      toast({
        title: "Error",
        description: "Visit date is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      await treatmentVisitsAPI.create(treatmentId, {
        visitDate: visitData.visitDate,
        status: visitData.status,
        notes: visitData.notes || undefined,
        procedures: visitData.procedures || undefined,
        cost: visitData.cost ? parseFloat(visitData.cost) : 0,
        duration: visitData.duration ? parseInt(visitData.duration) : undefined,
        isBilled: visitData.isBilled,
      });

      toast({
        title: "Success",
        description: "Visit added successfully",
      });

      setShowAddDialog(false);
      setVisitData({
        visitDate: new Date().toISOString().split("T")[0],
        status: "COMPLETED",
        notes: "",
        procedures: "",
        cost: "",
        duration: "",
        isBilled: false,
      });
      fetchVisits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add visit",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 size-3" />
            Completed
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 size-3" />
            Scheduled
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 size-3" />
            Cancelled
          </Badge>
        );
      case "NO_SHOW":
        return <Badge variant="outline">No Show</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Treatment Visits</h3>
          <p className="text-sm text-muted-foreground">Multi-visit progress tracking</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 size-4" />
          Add Visit
        </Button>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No visits recorded yet</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 size-4" />
              Add First Visit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <Card key={visit.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Visit #{visit.visitNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(visit.visitDate).toLocaleDateString()} 
                      {visit.duration && ` • ${visit.duration} mins`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(visit.status)}
                    {visit.isBilled && (
                      <Badge variant="outline" className="bg-green-50">
                        Billed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visit.procedures && (
                    <div>
                      <span className="text-sm font-medium">Procedures:</span>
                      <p className="text-sm text-muted-foreground">{visit.procedures}</p>
                    </div>
                  )}
                  {visit.notes && (
                    <div>
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm text-muted-foreground">{visit.notes}</p>
                    </div>
                  )}
                  {visit.cost > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="size-4" />
                      <span className="font-medium">₹{visit.cost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Visit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Treatment Visit</DialogTitle>
            <DialogDescription>
              Record details of a treatment visit
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="visitDate">Visit Date *</Label>
              <Input
                id="visitDate"
                type="date"
                value={visitData.visitDate}
                onChange={(e) => setVisitData({ ...visitData, visitDate: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={visitData.status}
                onValueChange={(value) => setVisitData({ ...visitData, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="procedures">Procedures Performed</Label>
              <Textarea
                id="procedures"
                value={visitData.procedures}
                onChange={(e) => setVisitData({ ...visitData, procedures: e.target.value })}
                placeholder="List procedures performed during this visit"
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cost">Cost (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={visitData.cost}
                  onChange={(e) => setVisitData({ ...visitData, cost: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (mins)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={visitData.duration}
                  onChange={(e) => setVisitData({ ...visitData, duration: e.target.value })}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={visitData.notes}
                onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
                placeholder="Additional notes about this visit"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBilled"
                checked={visitData.isBilled}
                onChange={(e) => setVisitData({ ...visitData, isBilled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isBilled" className="cursor-pointer">
                Mark as billed
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVisit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Add Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

