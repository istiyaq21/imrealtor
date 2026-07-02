"use client";

import { useState, useTransition, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { submitEnquiryAction } from "@/app/properties/actions";

interface EnquiryFormProps {
  propertyId: string;
  propertyTitle: string;
}

export default function EnquiryForm({ propertyId, propertyTitle }: EnquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("propertyId", propertyId);

    startTransition(async () => {
      const result = await submitEnquiryAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSubmitted(true);
    });
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
      <Input label="Email" name="email" type="email" placeholder="you@example.com" />
      <Textarea
        label="Message"
        name="message"
        defaultValue={`Hi, I'm interested in "${propertyTitle}". Please share more details.`}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send Enquiry"}
      </Button>
    </form>
  );
}
