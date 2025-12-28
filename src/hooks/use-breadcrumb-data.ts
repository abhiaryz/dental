import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface BreadcrumbEntity {
  name: string;
  id?: string;
  invoiceNumber?: string;
}

export function useBreadcrumbData() {
  const pathname = usePathname();
  const [entityData, setEntityData] = useState<Record<string, BreadcrumbEntity>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntityData = async () => {
      const segments = pathname.split("/").filter(Boolean);
      const newEntityData: Record<string, BreadcrumbEntity> = {};

      try {
        setLoading(true);

        // Check for invoice ID in finance section
        const invoicesIndex = segments.indexOf("invoices");
        if (invoicesIndex !== -1 && segments[invoicesIndex + 1]) {
          const invoiceId = segments[invoicesIndex + 1];
          try {
            const response = await fetch(`/api/breadcrumb/invoice/${invoiceId}`);
            if (response.ok) {
              const data = await response.json();
              newEntityData[invoiceId] = data;
            }
          } catch (error) {
            console.error("Failed to fetch invoice breadcrumb:", error);
          }
        }

        setEntityData(newEntityData);
      } catch (error) {
        console.error("Error fetching breadcrumb data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchEntityData();
  }, [pathname]);

  return { entityData, loading };
}

