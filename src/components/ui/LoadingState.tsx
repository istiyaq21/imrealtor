interface LoadingStateProps {
  label?: string;
  className?: string;
}

export default function LoadingState({ label = "Loading…", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center gap-2 p-8 text-sm text-slate-500 ${className}`}>
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600"
      />
      <span role="status">{label}</span>
    </div>
  );
}
