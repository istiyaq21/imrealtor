"use client";

import { useState, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

interface EnquiryFormProps {
  propertyTitle: string;
}

// TODO(supabase): insert into an `enquiries` table linked to the property
// and assigned agent, instead of only local UI state.
export default function EnquiryForm({ propertyTitle }: EnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-medium text-emerald-800">
          Your enquiry for &quot;{propertyTitle}&quot; has been sent.
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          The assigned agent will contact you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Your Name" name="name" required placeholder="Full name" />
      <Input label="Phone" name="phone" type="tel" required placeholder="+91 90000 00000" />
      <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
      <Textarea
        label="Message"
        name="message"
        required
        defaultValue={`Hi, I'm interested in "${propertyTitle}". Please share more details.`}
      />
      <Button type="submit" className="w-full">
        Send Enquiry
      </Button>
    </form>
  );
}
