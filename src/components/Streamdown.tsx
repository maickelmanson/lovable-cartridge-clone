import { cn } from "@/lib/utils";

interface StreamdownProps {
  children: string;
  className?: string;
}

export function Streamdown({ children, className }: StreamdownProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {children}
    </div>
  );
}
