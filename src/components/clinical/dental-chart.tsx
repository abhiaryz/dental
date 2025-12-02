"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { dentalChartAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DentalChartProps {
  treatmentId: string;
}

const TOOTH_CONDITIONS = [
  { value: "healthy", label: "Healthy", color: "bg-green-500" },
  { value: "cavity", label: "Cavity", color: "bg-red-500" },
  { value: "filling", label: "Filling", color: "bg-blue-500" },
  { value: "crown", label: "Crown", color: "bg-yellow-500" },
  { value: "root_canal", label: "Root Canal", color: "bg-purple-500" },
  { value: "implant", label: "Implant", color: "bg-indigo-500" },
  { value: "bridge", label: "Bridge", color: "bg-orange-500" },
  { value: "missing", label: "Missing", color: "bg-gray-500" },
  { value: "extraction_needed", label: "Extraction Needed", color: "bg-pink-500" },
];

// Adult teeth numbering (FDI notation)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

export function DentalChart({ treatmentId }: DentalChartProps) {
  const [chart, setChart] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChart();
  }, [treatmentId]);

  const fetchChart = async () => {
    try {
      setLoading(true);
      const response = await dentalChartAPI.get(treatmentId);
      setChart(response.chart || {});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch dental chart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await dentalChartAPI.update(treatmentId, chart);
      toast({
        title: "Success",
        description: "Dental chart saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save dental chart",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTooth = (toothNumber: number, condition: string) => {
    setChart({
      ...chart,
      [toothNumber]: {
        condition,
        notes: chart[toothNumber]?.notes || "",
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const getToothColor = (toothNumber: number) => {
    const condition = chart[toothNumber]?.condition;
    return TOOTH_CONDITIONS.find((c) => c.value === condition)?.color || "bg-white";
  };

  const Tooth = ({ number }: { number: number }) => {
    const condition = chart[number]?.condition;
    const isSelected = selectedTooth === number;

    return (
      <button
        onClick={() => setSelectedTooth(number)}
        className={`
          relative w-12 h-16 rounded-lg border-2 transition-all
          ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-300"}
          ${getToothColor(number)}
          hover:scale-110 hover:shadow-lg
        `}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-gray-900">{number}</span>
          {condition && (
            <span className="text-[8px] text-gray-700 mt-1 px-1 bg-white/70 rounded">
              {TOOTH_CONDITIONS.find((c) => c.value === condition)?.label}
            </span>
          )}
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dental Chart</h3>
          <p className="text-sm text-muted-foreground">Visual tooth-by-tooth status map</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save Chart
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tooth Chart (FDI Notation)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Upper Jaw */}
            <div>
              <p className="text-sm font-medium mb-4 text-center">Upper Jaw</p>
              <div className="flex justify-center gap-12">
                {/* Upper Right */}
                <div className="flex gap-1">
                  {UPPER_RIGHT.map((tooth) => (
                    <Tooth key={tooth} number={tooth} />
                  ))}
                </div>
                {/* Upper Left */}
                <div className="flex gap-1">
                  {UPPER_LEFT.map((tooth) => (
                    <Tooth key={tooth} number={tooth} />
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Jaw */}
            <div>
              <p className="text-sm font-medium mb-4 text-center">Lower Jaw</p>
              <div className="flex justify-center gap-12">
                {/* Lower Right */}
                <div className="flex gap-1">
                  {LOWER_RIGHT.map((tooth) => (
                    <Tooth key={tooth} number={tooth} />
                  ))}
                </div>
                {/* Lower Left */}
                <div className="flex gap-1">
                  {LOWER_LEFT.map((tooth) => (
                    <Tooth key={tooth} number={tooth} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooth Editor */}
      {selectedTooth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tooth #{selectedTooth}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Condition</label>
              <Select
                value={chart[selectedTooth]?.condition || "healthy"}
                onValueChange={(value) => updateTooth(selectedTooth, value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOTH_CONDITIONS.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${condition.color}`} />
                        {condition.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {TOOTH_CONDITIONS.map((condition) => (
              <div key={condition.value} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${condition.color}`} />
                <span className="text-xs">{condition.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

