'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { invoicesAPI, patientsAPI } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { invoiceSchema, validateData } from '@/lib/validation';
import { TableSkeleton } from '@/components/ui/table-skeleton';

interface InvoiceEditProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceEditPage({ params }: InvoiceEditProps) {
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: '',
    status: 'PENDING',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const [invoiceData, patientsData] = await Promise.all([
        invoicesAPI.getById(id),
        patientsAPI.getAll(),
      ]);

      // Pre-fill form with existing invoice data
      setFormData({
        patientId: invoiceData.patientId,
        dueDate: invoiceData.dueDate?.split('T')[0] || '',
        status: invoiceData.status,
        notes: invoiceData.notes || '',
        items: invoiceData.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [{ description: '', quantity: 1, unitPrice: 0 }],
      });

      setPatients(patientsData.patients || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void params.then(p => {
      setInvoiceId(p.id);
      void fetchData(p.id);
    });
  }, [params, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const validation = validateData(invoiceSchema, {
      ...formData,
      items: formData.items.filter(
        item => item.description && item.quantity > 0 && item.unitPrice >= 0
      ),
    });

    if (!validation.success) {
      setErrors(validation.errors || {});
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      await invoicesAPI.update(invoiceId, validation.data);

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      router.push(`/dashboard/finance/invoices/${invoiceId}`);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice || 0),
      0
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/finance">
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <TableSkeleton columns={4} rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/finance/invoices/${invoiceId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Invoice</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient *</Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, patientId: value })
                  }
                >
                  <SelectTrigger id="patientId">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patientId && (
                  <p className="text-sm text-destructive">{errors.patientId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
                {errors.dueDate && (
                  <p className="text-sm text-destructive">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 size-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 border rounded-lg"
              >
                <div className="sm:col-span-5 space-y-2">
                  <Label htmlFor={`description-${index}`}>Description *</Label>
                  <Input
                    id={`description-${index}`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, 'description', e.target.value)
                    }
                    placeholder="Item description"
                  />
                  {errors[`items.${index}.description`] && (
                    <p className="text-sm text-destructive">
                      {errors[`items.${index}.description`]}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', parseInt(e.target.value) || 0)
                    }
                  />
                  {errors[`items.${index}.quantity`] && (
                    <p className="text-sm text-destructive">
                      {errors[`items.${index}.quantity`]}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor={`unitPrice-${index}`}>Unit Price *</Label>
                  <Input
                    id={`unitPrice-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                  />
                  {errors[`items.${index}.unitPrice`] && (
                    <p className="text-sm text-destructive">
                      {errors[`items.${index}.unitPrice`]}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label>Total</Label>
                  <div className="flex items-center h-10">
                    <span className="font-semibold">
                      ₹{(item.quantity * item.unitPrice).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-1 space-y-2">
                  <Label className="invisible sm:visible">Action</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="text-sm text-destructive">{errors.items}</p>
            )}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-6">
            <Link href={`/dashboard/finance/invoices/${invoiceId}`} className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

