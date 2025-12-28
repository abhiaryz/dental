"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Users, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResults {
  patients: Array<never>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
  }>;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    patients: [],
    invoices: [],
  });
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const searchAPI = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults({
        patients: [],
        invoices: [],
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void searchAPI(debouncedQuery);
  }, [debouncedQuery, searchAPI]);

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
    setQuery("");
  };

  const hasResults =
    results.patients.length > 0 ||
    results.invoices.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="size-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            autoFocus
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Type at least 2 characters to search
            </div>
          ) : !loading && !hasResults ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {results.invoices.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    <FileText className="size-4" />
                    Invoices
                  </div>
                  {results.invoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent flex items-center gap-3 transition-colors"
                      onClick={() => handleSelect(`/dashboard/finance/invoices/${invoice.id}`)}
                    >
                      <FileText className="size-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">Invoice #{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          ₹{invoice.totalAmount} • {invoice.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </>
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Press ESC to close</span>
          <span>Use ↑ ↓ to navigate</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

