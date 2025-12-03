"use client";

import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Image as ImageIcon, Upload, Eye, Trash2, Download, Filter, Loader2 } from "lucide-react";
import { clinicalImagesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ClinicalImagesGalleryProps {
  patientId: string;
  treatmentId?: string;
}

const IMAGE_TYPES = [
  { value: "XRAY", label: "X-Ray" },
  { value: "INTRAORAL", label: "Intraoral Photo" },
  { value: "EXTRAORAL", label: "Extraoral Photo" },
  { value: "PERIAPICAL", label: "Periapical" },
  { value: "BITEWING", label: "Bitewing" },
  { value: "PANORAMIC", label: "Panoramic" },
  { value: "CEPHALOMETRIC", label: "Cephalometric" },
  { value: "CBCT", label: "CBCT Scan" },
  { value: "BEFORE_TREATMENT", label: "Before Treatment" },
  { value: "DURING_TREATMENT", label: "During Treatment" },
  { value: "AFTER_TREATMENT", label: "After Treatment" },
  { value: "OTHER", label: "Other" },
];

export function ClinicalImagesGallery({ patientId, treatmentId }: ClinicalImagesGalleryProps) {
  const [images, setImages] = useState<any[]>([]);
  const [filteredImages, setFilteredImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    type: "XRAY",
    title: "",
    toothNumber: "",
    notes: "",
  });

  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clinicalImagesAPI.getAll({
        patientId,
        treatmentId: treatmentId || undefined,
      });
      setImages(response.images || []);
      setFilteredImages(response.images || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, treatmentId, toast]);

  useEffect(() => {
    void fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (filterType === "all") {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter((img) => img.type === filterType));
    }
  }, [filterType, images]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadData.title) {
        setUploadData({ ...uploadData, title: file.name });
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadData.title) {
      toast({
        title: "Error",
        description: "Please select a file and enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("patientId", patientId);
      if (treatmentId) formData.append("treatmentId", treatmentId);
      formData.append("type", uploadData.type);
      formData.append("title", uploadData.title);
      if (uploadData.toothNumber) formData.append("toothNumber", uploadData.toothNumber);
      if (uploadData.notes) formData.append("notes", uploadData.notes);

      await clinicalImagesAPI.upload(formData);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadData({ type: "XRAY", title: "", toothNumber: "", notes: "" });
      fetchImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await clinicalImagesAPI.delete(deleteId);
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      setDeleteId(null);
      fetchImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleView = (image: any) => {
    setSelectedImage(image);
    setShowViewDialog(true);
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {IMAGE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 size-4" />
          Upload Image
        </Button>
      </div>

      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No clinical images found</p>
            <Button className="mt-4" onClick={() => setShowUploadDialog(true)}>
              <Upload className="mr-2 size-4" />
              Upload First Image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden group relative">
              <div className="relative aspect-square bg-muted">
                <NextImage
                  src={image.fileUrl}
                  alt={image.title || "Clinical image"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleView(image)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteId(image.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">{image.title}</h4>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {IMAGE_TYPES.find((t) => t.value === image.type)?.label}
                    </Badge>
                  </div>
                  {image.toothNumber && (
                    <p className="text-xs text-muted-foreground">
                      Tooth: {image.toothNumber}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(image.capturedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Clinical Image</DialogTitle>
            <DialogDescription>
              Upload X-rays, photos, or scans for this patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Image File *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="type">Image Type *</Label>
              <Select
                value={uploadData.type}
                onValueChange={(value) => setUploadData({ ...uploadData, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="e.g., Right upper molar X-ray"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="toothNumber">Tooth Number (Optional)</Label>
              <Input
                id="toothNumber"
                value={uploadData.toothNumber}
                onChange={(e) => setUploadData({ ...uploadData, toothNumber: e.target.value })}
                placeholder="e.g., 16, 21, etc."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Additional notes about this image"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <DialogDescription>
              {IMAGE_TYPES.find((t) => t.value === selectedImage?.type)?.label} •{" "}
              {selectedImage && new Date(selectedImage.capturedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <NextImage
                  src={selectedImage.fileUrl}
                  alt={selectedImage.title || "Clinical image"}
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              </div>

              <div className="space-y-2">
                {selectedImage.toothNumber && (
                  <div>
                    <span className="font-medium">Tooth Number:</span>{" "}
                    {selectedImage.toothNumber}
                  </div>
                )}
                {selectedImage.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-muted-foreground mt-1">{selectedImage.notes}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">File Size:</span>{" "}
                  {selectedImage.fileSize
                    ? `${(selectedImage.fileSize / 1024 / 1024).toFixed(2)} MB`
                    : "N/A"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button asChild>
              <a href={selectedImage?.fileUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 size-4" />
                Download
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinical Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

