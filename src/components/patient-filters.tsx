"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface PatientFilterState {
  gender: string;
  minAge: string;
  maxAge: string;
  lastVisitFrom: string;
  lastVisitTo: string;
  status: string;
}

interface PatientFiltersProps {
  filters: PatientFilterState;
  onFilterChange: (filters: PatientFilterState) => void;
  onClearFilters: () => void;
}

export function PatientFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: PatientFiltersProps) {
  const handleChange = (key: keyof PatientFilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "" && value !== "all");

  return (
    <div className="border-t border-b bg-slate-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
            <X className="size-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Gender Filter */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={filters.gender}
            onValueChange={(value) => handleChange("gender", value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active (Has Treatments)</SelectItem>
              <SelectItem value="new">New (No Treatments)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age Range - Min */}
        <div className="space-y-2">
          <Label htmlFor="minAge">Min Age</Label>
          <Input
            id="minAge"
            type="number"
            placeholder="e.g., 18"
            min="0"
            max="120"
            value={filters.minAge}
            onChange={(e) => handleChange("minAge", e.target.value)}
          />
        </div>

        {/* Age Range - Max */}
        <div className="space-y-2">
          <Label htmlFor="maxAge">Max Age</Label>
          <Input
            id="maxAge"
            type="number"
            placeholder="e.g., 65"
            min="0"
            max="120"
            value={filters.maxAge}
            onChange={(e) => handleChange("maxAge", e.target.value)}
          />
        </div>

        {/* Last Visit From */}
        <div className="space-y-2">
          <Label htmlFor="lastVisitFrom">Last Visit From</Label>
          <Input
            id="lastVisitFrom"
            type="date"
            value={filters.lastVisitFrom}
            onChange={(e) => handleChange("lastVisitFrom", e.target.value)}
          />
        </div>

        {/* Last Visit To */}
        <div className="space-y-2">
          <Label htmlFor="lastVisitTo">Last Visit To</Label>
          <Input
            id="lastVisitTo"
            type="date"
            value={filters.lastVisitTo}
            onChange={(e) => handleChange("lastVisitTo", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

