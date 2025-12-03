"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Database,
  Search,
  Table2,
  Loader2,
  ChevronRight,
  Layers,
} from "lucide-react";

interface TableInfo {
  name: string;
  displayName: string;
  category: string;
  recordCount: number;
  fieldCount: number;
}

interface GroupedTables {
  category: string;
  tables: TableInfo[];
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [groupedTables, setGroupedTables] = useState<GroupedTables[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/database");
      const data = await response.json();

      if (data && data.tables) {
        setTables(data.tables);
        setGroupedTables(data.groupedTables || []);
        setTotalRecords(data.totalRecords || 0);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Filter tables based on search
  const filteredGroups = groupedTables
    .map((group) => ({
      ...group,
      tables: group.tables.filter(
        (table) =>
          table.name.toLowerCase().includes(search.toLowerCase()) ||
          table.displayName.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.tables.length > 0);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Authentication: "🔐",
      "Clinic Management": "🏥",
      "Patient Care": "👨‍⚕️",
      Billing: "💰",
      Inventory: "📦",
      System: "⚙️",
    };
    return icons[category] || "📁";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Authentication: "from-purple-500 to-indigo-600",
      "Clinic Management": "from-teal-500 to-cyan-600",
      "Patient Care": "from-blue-500 to-sky-600",
      Billing: "from-emerald-500 to-green-600",
      Inventory: "from-amber-500 to-orange-600",
      System: "from-slate-500 to-gray-600",
    };
    return colors[category] || "from-gray-500 to-slate-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Database Manager</h1>
          <p className="text-slate-600">
            View and manage all database tables
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-white">
            <div className="text-2xl font-bold">{tables.length}</div>
            <div className="text-xs opacity-90">Tables</div>
          </div>
          <div className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-white">
            <div className="text-2xl font-bold">
              {totalRecords.toLocaleString()}
            </div>
            <div className="text-xs opacity-90">Total Records</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      ) : (
        /* Tables Grid by Category */
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <div key={group.category}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(group.category)}</span>
                <h2 className="text-xl font-semibold text-slate-800">
                  {group.category}
                </h2>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {group.tables.length} tables
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.tables.map((table) => (
                  <Link
                    key={table.name}
                    href={`/super-admin/database/${table.name.toLowerCase()}`}
                  >
                    <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div
                            className={`rounded-lg bg-gradient-to-br ${getCategoryColor(group.category)} p-2`}
                          >
                            <Table2 className="h-5 w-5 text-white" />
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                        <CardTitle className="mt-3 text-base">
                          {table.displayName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Database className="h-3.5 w-3.5" />
                            <span>{table.recordCount.toLocaleString()} records</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <Layers className="h-3.5 w-3.5" />
                            <span>{table.fieldCount} fields</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-600">
              <Database className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4">No tables found matching your search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

