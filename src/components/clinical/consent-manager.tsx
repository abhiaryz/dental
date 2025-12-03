"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Download, CheckCircle, Clock, Loader2, PenTool } from "lucide-react";
import { consentsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ConsentManagerProps {
  patientId: string;
  treatmentId?: string;
}

export function ConsentManager({ patientId, treatmentId }: ConsentManagerProps) {
  const [consents, setConsents] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signing, setSigning] = useState(false);
  
  const [signData, setSignData] = useState({
    templateId: "",
    signedBy: "",
    notes: "",
  });

  // Canvas signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const { toast } = useToast();
  
  const fetchConsents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await consentsAPI.getAll({
        patientId,
        treatmentId: treatmentId || undefined,
      });
      setConsents(response.consents || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch consents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, treatmentId, toast]);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await consentsAPI.templates.getAll({ isActive: true });
      setTemplates(response.templates || []);
    } catch (error: any) {
      console.error("Failed to fetch templates:", error);
    }
  }, []);

  useEffect(() => {
    fetchConsents();
    fetchTemplates();
  }, [fetchConsents, fetchTemplates]);

  // Canvas signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
      setHasSignature(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
      }
    }
  };

  const handleSign = async () => {
    if (!signData.templateId || !signData.signedBy || !hasSignature) {
      toast({
        title: "Error",
        description: "Please select a template, enter your name, and provide a signature",
        variant: "destructive",
      });
      return;
    }

    try {
      setSigning(true);

      // Convert canvas to blob
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });

      const formData = new FormData();
      formData.append("patientId", patientId);
      if (treatmentId) formData.append("treatmentId", treatmentId);
      formData.append("templateId", signData.templateId);
      formData.append("signedBy", signData.signedBy);
      if (signData.notes) formData.append("notes", signData.notes);
      formData.append("signature", blob, "signature.png");

      await consentsAPI.create(formData);

      toast({
        title: "Success",
        description: "Consent signed successfully",
      });

      setShowSignDialog(false);
      setSignData({ templateId: "", signedBy: "", notes: "" });
      clearSignature();
      fetchConsents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign consent",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SIGNED":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 size-3" />Signed</Badge>;
      case "PENDING":
        return <Badge variant="secondary"><Clock className="mr-1 size-3" />Pending</Badge>;
      case "DECLINED":
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Consent Forms</h3>
          <p className="text-sm text-muted-foreground">Digital consent documentation</p>
        </div>
        <Button onClick={() => setShowSignDialog(true)}>
          <Plus className="mr-2 size-4" />
          New Consent
        </Button>
      </div>

      {consents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No consent forms signed yet</p>
            <Button className="mt-4" onClick={() => setShowSignDialog(true)}>
              <Plus className="mr-2 size-4" />
              Sign First Consent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {consents.map((consent) => (
            <Card key={consent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{consent.template.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Signed by: {consent.signedBy} •{" "}
                      {consent.signedAt && new Date(consent.signedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(consent.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {consent.pdfUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={consent.pdfUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 size-4" />
                        Download PDF
                      </a>
                    </Button>
                  )}
                  {consent.signatureUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={consent.signatureUrl} target="_blank" rel="noopener noreferrer">
                        <PenTool className="mr-2 size-4" />
                        View Signature
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sign Consent Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sign Consent Form</DialogTitle>
            <DialogDescription>
              Select a consent template and provide your signature
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Consent Template *</Label>
              <Select
                value={signData.templateId}
                onValueChange={(value) => setSignData({ ...signData, templateId: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="signedBy">Full Name *</Label>
              <Input
                id="signedBy"
                value={signData.signedBy}
                onChange={(e) => setSignData({ ...signData, signedBy: e.target.value })}
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Signature *</Label>
              <div className="mt-1 border rounded-md">
                <canvas
                  ref={canvasRef}
                  width={550}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full cursor-crosshair touch-none"
                  style={{ border: "1px solid #e5e7eb" }}
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                >
                  Clear Signature
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={signData.notes}
                onChange={(e) => setSignData({ ...signData, notes: e.target.value })}
                placeholder="Additional notes"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <PenTool className="mr-2 size-4" />}
              Sign Consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

