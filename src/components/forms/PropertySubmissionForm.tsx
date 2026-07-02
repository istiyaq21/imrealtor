"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";

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

const amenitiesList = [
  "Clubhouse",
  "24x7 Security",
  "Power Backup",
  "Covered Parking",
  "Gym",
  "Lift",
  "Private Garden",
];

export interface PropertySubmissionResult {
  ok: boolean;
  message: string;
}

interface PropertySubmissionFormProps {
  action: (formData: FormData) => Promise<PropertySubmissionResult>;
}

export default function PropertySubmissionForm({ action }: PropertySubmissionFormProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFileNames(Array.from(event.target.files ?? []).map((file) => file.name));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await action(formData);
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
        <h2 className="text-lg font-semibold text-emerald-800">
          Property submitted for admin review
        </h2>
        <p className="mt-2 text-sm text-emerald-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input label="Title" name="title" required placeholder="e.g. Sunrise Heights 3BHK" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Purpose" name="purpose" required placeholder="Select purpose" options={purposeOptions} />
        <Select label="Property Type" name="type" required placeholder="Select type" options={typeOptions} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="City" name="city" required placeholder="City" />
        <Input label="Locality" name="locality" required placeholder="Locality / Area" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Price" name="price" type="number" required placeholder="Amount in ₹" />
        <Input label="Area (sq. ft.)" name="area" type="number" required placeholder="e.g. 1200" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Bedrooms" name="bedrooms" type="number" min={0} placeholder="e.g. 3" />
        <Input label="Bathrooms" name="bathrooms" type="number" min={0} placeholder="e.g. 2" />
      </div>

      <Textarea
        label="Description"
        name="description"
        required
        placeholder="Describe the property, nearby landmarks, and condition"
      />

      <fieldset>
        <legend className="text-sm font-medium text-slate-800">Amenities</legend>
        <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {amenitiesList.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="amenities"
                value={amenity}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {amenity}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="images" className="text-sm font-medium text-slate-800">
          Property Images (optional)
        </label>
        {/* TODO(storage): images upload straight to the private
            property-images bucket and are only ever served back via a
            short-lived signed URL — see src/lib/services/storage.ts for
            the still-open signed-URL-vs-proxy decision. */}
        <input
          id="images"
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          {selectedFileNames.length > 0
            ? `${selectedFileNames.length} image${selectedFileNames.length === 1 ? "" : "s"} selected, ready to upload after submission: ${selectedFileNames.join(", ")}`
            : "Optional — you can add images now or attach them later. If an image fails to upload, your property submission still goes through."}
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      <p className="text-xs text-slate-500">
        Your submission will be reviewed by our admin team before it becomes visible to buyers.
      </p>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit for Review"}
      </Button>
    </form>
  );
}
