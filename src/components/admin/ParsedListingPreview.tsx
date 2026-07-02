"use client";

import { useState, useTransition } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { saveImportAsPropertyAction } from "@/app/admin/imports/actions";
import type { ParsedListingData } from "@/lib/services/listing-imports";

const purposeOptions = [
  { label: "Sell", value: "sell" },
  { label: "Rent", value: "rent" },
];

const typeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Independent House", value: "independent-house" },
  { label: "Plot", value: "plot" },
  { label: "Commercial", value: "commercial" },
  { label: "Office", value: "office" },
];

interface ParsedListingPreviewProps {
  importId: string;
  initialData: ParsedListingData;
  onSaved: () => void;
}

export default function ParsedListingPreview({ importId, initialData, onSaved }: ParsedListingPreviewProps) {
  const [data, setData] = useState<ParsedListingData>(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ParsedListingData>(key: K, value: ParsedListingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveImportAsPropertyAction(importId, data);
      setMessage(result.message);
      if (result.ok) {
        onSaved();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">Parsed Fields — Review Before Saving</h3>
        <Badge tone="warning">Draft — not saved yet</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Purpose"
          placeholder="Select purpose"
          options={purposeOptions}
          value={data.purpose ?? ""}
          onChange={(e) => update("purpose", e.target.value as ParsedListingData["purpose"])}
        />
        <Select
          label="Property Type"
          placeholder="Select type"
          options={typeOptions}
          value={data.type ?? ""}
          onChange={(e) => update("type", e.target.value)}
        />
        <Input label="City" value={data.city ?? ""} onChange={(e) => update("city", e.target.value)} />
        <Input label="Locality" value={data.locality ?? ""} onChange={(e) => update("locality", e.target.value)} />
        <Input
          label="Price (₹)"
          type="number"
          value={data.price ?? ""}
          onChange={(e) => update("price", Number(e.target.value))}
        />
        <Input label="Area" value={data.area ?? ""} onChange={(e) => update("area", e.target.value)} />
        <Input
          label="Bedrooms"
          type="number"
          min={0}
          value={data.bedrooms ?? ""}
          onChange={(e) => update("bedrooms", Number(e.target.value))}
        />
        <Input
          label="Bathrooms"
          type="number"
          min={0}
          value={data.bathrooms ?? ""}
          onChange={(e) => update("bathrooms", Number(e.target.value))}
        />
        <Input label="Phone" value={data.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
      </div>

      {data.amenities && data.amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.amenities.map((amenity) => (
            <Badge key={amenity} tone="neutral">
              {amenity}
            </Badge>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        AI import is a draft helper. Admin must verify before listing goes public — saving here creates a
        pending property (not approved), exactly like any other submission.
      </p>

      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}

      <Button className="mt-4 w-full sm:w-auto" disabled={isPending} onClick={handleSave}>
        {isPending ? "Saving…" : "Save as Pending Property"}
      </Button>
    </div>
  );
}
