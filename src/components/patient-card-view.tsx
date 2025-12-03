"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, User, Calendar } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email?: string;
  _count?: {
    treatments: number;
    appointments: number;
  };
}

interface PatientCardViewProps {
  patients: Patient[];
}

export function PatientCardView({ patients }: PatientCardViewProps) {
  const calculateAge = (dateOfBirth: string) => {
    const age = Math.floor(
      (new Date().getTime() - new Date(dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );
    return age;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {patients.map((patient) => {
        const age = calculateAge(patient.dateOfBirth);
        const hasActiveTreatments = (patient._count?.treatments || 0) > 0;

        return (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {age} years • {patient.gender}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={hasActiveTreatments ? "default" : "secondary"}
                  className={hasActiveTreatments ? "bg-success text-success-foreground" : ""}
                >
                  {hasActiveTreatments ? "Active" : "New"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{patient.mobileNumber}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{patient._count?.treatments || 0} treatments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{patient._count?.appointments || 0} appointments</span>
                  </div>
                </div>
              </div>

              <Link href={`/dashboard/patients/${patient.id}`}>
                <Button variant="outline" className="w-full" size="sm">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

