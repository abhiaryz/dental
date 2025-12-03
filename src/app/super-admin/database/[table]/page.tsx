"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Check,
  X,
  Edit2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FieldMetadata {
  name: string;
  type: string;
  kind: "scalar" | "enum" | "object";
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isReadOnly: boolean;
  isSensitive: boolean;
  hasDefaultValue: boolean;
  enumValues?: string[];
}

interface TableMetadata {
  tableName: string;
  fields: FieldMetadata[];
}

type RecordData = Record<string, unknown>;

interface PageParams {
  table: string;
}

export default function TableDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = use(params);
  const tableName = resolvedParams.table;

  const [records, setRecords] = useState<RecordData[]>([]);
  const [metadata, setMetadata] = useState<TableMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<RecordData>({});
  const [saving, setSaving] = useState(false);

  // New record state
  const [isCreating, setIsCreating] = useState(false);
  const [newRecordData, setNewRecordData] = useState<RecordData>({});

  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (search) params.append("search", search);

      const response = await fetch(
        `/api/super-admin/database/${tableName}?${params}`
      );
      const data = await response.json();

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setRecords(data.records || []);
      setMetadata(data.metadata || null);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, tableName, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Start editing a record
  const handleEdit = (record: RecordData) => {
    setEditingId(record.id as string);
    setEditingData({ ...record });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  // Save edited record
  const handleSave = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/super-admin/database/${tableName}/${editingId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to update record",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Record updated successfully",
      });

      setEditingId(null);
      setEditingData({});
      fetchRecords();
    } catch (error) {
      console.error("Failed to save record:", error);
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Start creating new record
  const handleStartCreate = () => {
    setIsCreating(true);
    setNewRecordData({});
  };

  // Cancel creating
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewRecordData({});
  };

  // Create new record
  const handleCreate = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/super-admin/database/${tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecordData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to create record",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Record created successfully",
      });

      setIsCreating(false);
      setNewRecordData({});
      fetchRecords();
    } catch (error) {
      console.error("Failed to create record:", error);
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get editable fields (exclude read-only and id)
  const editableFields =
    metadata?.fields.filter((f) => !f.isReadOnly && !f.isId) || [];

  // Get display fields (all non-sensitive)
  const displayFields = metadata?.fields || [];

  // Render cell value
  const renderCellValue = (field: FieldMetadata, value: unknown) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-400 italic">null</span>;
    }

    if (field.type === "boolean") {
      return value ? (
        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
          true
        </span>
      ) : (
        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
          false
        </span>
      );
    }

    if (field.type === "datetime") {
      return new Date(value as string).toLocaleString();
    }

    if (field.kind === "enum") {
      return (
        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {String(value)}
        </span>
      );
    }

    const strValue = String(value);
    if (strValue.length > 50) {
      return strValue.substring(0, 50) + "...";
    }

    return strValue;
  };

  // Render input for editing
  const renderEditInput = (
    field: FieldMetadata,
    value: unknown,
    onChange: (value: unknown) => void
  ) => {
    if (field.kind === "enum" && field.enumValues) {
      return (
        <select
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Select...</option>
          {field.enumValues.map((enumVal) => (
            <option key={enumVal} value={enumVal}>
              {enumVal}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "boolean") {
      return (
        <select
          value={String(value || false)}
          onChange={(e) => onChange(e.target.value === "true")}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="false">false</option>
          <option value="true">true</option>
        </select>
      );
    }

    if (field.type === "datetime") {
      const dateValue = value
        ? new Date(value as string).toISOString().slice(0, 16)
        : "";
      return (
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
          step="any"
        />
      );
    }

    return (
      <input
        type="text"
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
      />
    );
  };

  const displayTableName =
    metadata?.tableName?.replace(/([A-Z])/g, " $1").trim() ||
    tableName.charAt(0).toUpperCase() + tableName.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/database">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {displayTableName}
            </h1>
            <p className="text-slate-600">
              {total.toLocaleString()} records • {displayFields.length} fields
            </p>
          </div>
        </div>
        <Button
          onClick={handleStartCreate}
          disabled={isCreating}
          className="bg-gradient-to-r from-blue-600 to-cyan-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search records..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Showing {records.length} of {total} records
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left font-medium">
                      Actions
                    </th>
                    {displayFields.map((field) => (
                      <th
                        key={field.name}
                        className="whitespace-nowrap px-4 py-3 text-left font-medium"
                      >
                        {field.name}
                        {field.isRequired && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                        <span className="ml-1 text-xs text-slate-400">
                          ({field.type})
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* New Record Row */}
                  {isCreating && (
                    <tr className="bg-blue-50">
                      <td className="sticky left-0 bg-blue-50 px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCreate}
                            disabled={saving}
                            className="h-7 w-7 p-0 text-green-600 hover:bg-green-100"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelCreate}
                            disabled={saving}
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      {displayFields.map((field) => (
                        <td key={field.name} className="px-4 py-3">
                          {field.isReadOnly || field.isId ? (
                            <span className="text-slate-400 italic">
                              {field.hasDefaultValue ? "auto" : "-"}
                            </span>
                          ) : (
                            renderEditInput(
                              field,
                              newRecordData[field.name],
                              (value) =>
                                setNewRecordData((prev) => ({
                                  ...prev,
                                  [field.name]: value,
                                }))
                            )
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Existing Records */}
                  {records.map((record) => (
                    <tr
                      key={String(record.id ?? Math.random())}
                      className={`hover:bg-slate-50 ${
                        editingId === String(record.id) ? "bg-yellow-50" : ""
                      }`}
                    >
                      <td className="sticky left-0 bg-white px-4 py-3">
                        {editingId === String(record.id) ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSave}
                              disabled={saving}
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-100"
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(record)}
                            className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                      {displayFields.map((field) => (
                        <td
                          key={field.name}
                          className="whitespace-nowrap px-4 py-3"
                        >
                          {editingId === record.id &&
                          editableFields.some((f) => f.name === field.name) ? (
                            renderEditInput(
                              field,
                              editingData[field.name],
                              (value) =>
                                setEditingData((prev) => ({
                                  ...prev,
                                  [field.name]: value,
                                }))
                            )
                          ) : (
                            renderCellValue(field, record[field.name])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {records.length === 0 && !isCreating && (
                    <tr>
                      <td
                        colSpan={displayFields.length + 1}
                        className="py-12 text-center text-slate-600"
                      >
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

