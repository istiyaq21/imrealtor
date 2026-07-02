"use client";

import { useState, useTransition, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { submitAccessRequestAction } from "@/app/request-access/actions";

const roleOptions = [
  { label: "Agent", value: "agent" },
  { label: "Property Owner", value: "owner" },
  { label: "Buyer / Tenant", value: "buyer" },
];

export default function RequestAccessForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitAccessRequestAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccessMessage(result.message);
    });
  }

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">Request received</h2>
        <p className="mt-2 text-sm text-emerald-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Full Name" name="fullName" required placeholder="Your full name" />
        <Input label="Phone" name="phone" type="tel" required placeholder="+91 90000 00000" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
        <Select
          label="Role Requested"
          name="role"
          required
          placeholder="Select a role"
          options={roleOptions}
        />
      </div>

      <Input label="City" name="city" required placeholder="Your city" />

      <Textarea
        label="Message"
        name="message"
        placeholder="Tell us a bit about what you're looking for"
      />

      {error && <ErrorMessage message={error} />}

      <p className="text-xs text-slate-500">
        Private beta access is reviewed by admin. Our team will review and contact you.
      </p>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit Request"}
      </Button>
    </form>
  );
}
