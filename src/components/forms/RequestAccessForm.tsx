"use client";

import { useState, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const roleOptions = [
  { label: "Agent", value: "agent" },
  { label: "Property Owner", value: "owner" },
  { label: "Buyer / Tenant", value: "buyer" },
];

// TODO(supabase): submit this form to a Supabase table (e.g. `access_requests`)
// instead of only updating local UI state, and notify admins server-side.
export default function RequestAccessForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">Request received</h2>
        <p className="mt-2 text-sm text-emerald-700">
          Thank you for your interest in I&apos;m Realtor. Our team will review and contact you.
        </p>
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

      <p className="text-xs text-slate-500">
        Private beta access is reviewed by admin. Our team will review and contact you.
      </p>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Submit Request
      </Button>
    </form>
  );
}
