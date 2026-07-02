"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { savePropertyAction, unsavePropertyAction } from "@/app/properties/actions";

interface SavePropertyButtonProps {
  propertyId: string;
  initialSaved: boolean;
}

export default function SavePropertyButton({ propertyId, initialSaved }: SavePropertyButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setMessage(null);
    startTransition(async () => {
      const result = saved ? await unsavePropertyAction(propertyId) : await savePropertyAction(propertyId);
      if (result.ok) {
        setSaved(!saved);
      }
      setMessage(result.message);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <Button variant={saved ? "outline" : "primary"} className="w-full" onClick={toggle} disabled={isPending}>
        {isPending ? "Saving…" : saved ? "Remove from Saved" : "Save Property"}
      </Button>
      {message && <p className="mt-2 text-center text-xs text-slate-500">{message}</p>}
    </div>
  );
}
