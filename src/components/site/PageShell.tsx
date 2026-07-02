import { type ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export default function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 py-12 ${className}`}>{children}</div>
  );
}
