import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export default function Input({ label, hint, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
          {label}
          {rest.required && <span className="text-brand-600"> *</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline focus:outline-2 focus:outline-brand-100 ${className}`}
        {...rest}
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
