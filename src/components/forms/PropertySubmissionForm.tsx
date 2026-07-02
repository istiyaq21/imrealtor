"use client";

import { useState, type FormEvent } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

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

// TODO(supabase): insert into a `properties` table with status "pending"
// and trigger an admin notification, instead of only local UI state.
export default function PropertySubmissionForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">
          Property submitted for admin review
        </h2>
        <p className="mt-2 text-sm text-emerald-700">
          We&apos;ll verify the details and publish your listing once approved.
        </p>
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
        <p className="text-sm font-medium text-slate-800">Property Images</p>
        <div className="mt-2 flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          Image upload placeholder — coming soon
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Your submission will be reviewed by our admin team before it becomes visible to buyers.
      </p>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        Submit for Review
      </Button>
    </form>
  );
}
