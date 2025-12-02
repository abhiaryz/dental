"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function BreadcrumbNav() {
  const pathname = usePathname();
  
  // Split the pathname into segments
  const segments = pathname.split("/").filter((segment) => segment !== "");
  
  // If we're on the home page, don't show breadcrumbs
  if (segments.length === 0) {
    return null;
  }

  // Function to format segment names
  const formatSegment = (segment: string) => {
    // Replace hyphens with spaces and capitalize
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Build breadcrumb items
  const breadcrumbs = [
    { name: "Home", href: "/" },
    ...segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      return {
        name: formatSegment(segment),
        href: href,
      };
    }),
  ];

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="mx-1.5 size-3.5" />}
          {index === 0 ? (
            <Link
              href={breadcrumb.href}
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="size-4" />
            </Link>
          ) : index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{breadcrumb.name}</span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

