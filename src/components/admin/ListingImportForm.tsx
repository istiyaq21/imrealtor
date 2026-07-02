"use client";

import { useState, useTransition, type FormEvent } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ParsedListingPreview from "./ParsedListingPreview";
import { createListingImportAction } from "@/app/admin/imports/actions";
import type { ParsedListingData } from "@/lib/services/listing-imports";

const PLACEHOLDER = `e.g. "3BHK apartment for sale in Andheri, Mumbai. 1450 sqft, 2 bath. ₹2.15 Cr. Clubhouse, gym, parking. Call 9876543210."`;

export default function ListingImportForm() {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedListingData | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleParse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.set("rawText", rawText);

    startTransition(async () => {
      const result = await createListingImportAction(formData);
      setMessage(result.message);
      if (result.ok && result.parsed && result.importId) {
        setParsed(result.parsed);
        setImportId(result.importId);
      }
    });
  }

  function handleSaved() {
    setParsed(null);
    setImportId(null);
    setRawText("");
    setMessage("Pending property created. Find it in Listings to approve or reject.");
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleParse} className="flex flex-col gap-4">
        <Textarea
          label="Paste WhatsApp listing text"
          name="rawText"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder={PLACEHOLDER}
          required
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending || !rawText.trim()} className="w-full sm:w-auto">
            {isPending ? "Parsing…" : "Parse Listing"}
          </Button>
          {message && <p className="text-sm text-slate-500">{message}</p>}
        </div>
      </form>

      {parsed && importId && (
        <ParsedListingPreview importId={importId} initialData={parsed} onSaved={handleSaved} />
      )}
    </div>
  );
}
