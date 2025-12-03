import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      {Icon && (
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 transition-transform hover:scale-105">
          <Icon className="size-10 sm:size-12 text-slate-400" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold mb-2 text-slate-900">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.icon && <action.icon className="mr-2 size-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

