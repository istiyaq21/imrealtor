import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

const cityOptions = [
  { label: "Mumbai", value: "Mumbai" },
  { label: "Bengaluru", value: "Bengaluru" },
  { label: "Pune", value: "Pune" },
  { label: "Delhi", value: "Delhi" },
  { label: "Hyderabad", value: "Hyderabad" },
  { label: "Jaipur", value: "Jaipur" },
];

const typeOptions = [
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Independent House", value: "independent-house" },
  { label: "Plot", value: "plot" },
  { label: "Commercial", value: "commercial" },
  { label: "Office", value: "office" },
];

const purposeOptions = [
  { label: "Buy", value: "sell" },
  { label: "Rent", value: "rent" },
];

const bedroomOptions = [
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];

interface PropertyFiltersProps {
  defaultQuery?: string;
  defaultCity?: string;
  defaultType?: string;
  defaultPurpose?: string;
  defaultBudget?: string;
  defaultBedrooms?: string;
}

export default function PropertyFilters({
  defaultQuery = "",
  defaultCity = "",
  defaultType = "",
  defaultPurpose = "",
  defaultBudget = "",
  defaultBedrooms = "",
}: PropertyFiltersProps) {
  return (
    <form method="get" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <Input
            label="Search"
            name="q"
            placeholder="Search by title, city, or locality"
            defaultValue={defaultQuery}
          />
        </div>

        <Select
          label="City"
          name="city"
          placeholder="Any city"
          options={cityOptions}
          defaultValue={defaultCity}
        />

        <Select
          label="Property Type"
          name="type"
          placeholder="Any type"
          options={typeOptions}
          defaultValue={defaultType}
        />

        <Select
          label="Buy / Rent"
          name="purpose"
          placeholder="Any"
          options={purposeOptions}
          defaultValue={defaultPurpose}
        />

        <Select
          label="Bedrooms"
          name="bedrooms"
          placeholder="Any"
          options={bedroomOptions}
          defaultValue={defaultBedrooms}
        />

        <div className="sm:col-span-2 lg:col-span-2">
          <Input
            label="Max Budget"
            name="budget"
            type="number"
            placeholder="e.g. 5000000"
            defaultValue={defaultBudget}
          />
        </div>

        <div className="flex items-end gap-3 lg:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            Apply Filters
          </Button>
          <Button href="/properties" variant="outline" className="w-full sm:w-auto">
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
