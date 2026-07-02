interface ErrorMessageProps {
  message: string;
  className?: string;
}

/** Safe-message-only display — callers must never pass raw internal/DB errors here. */
export default function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <p
      role="alert"
      className={`rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      {message}
    </p>
  );
}
