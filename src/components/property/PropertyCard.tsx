import Image from "next/image";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
}

const typeLabels: Record<Property["type"], string> = {
  apartment: "Apartment",
  villa: "Villa",
  "independent-house": "Independent House",
  plot: "Plot",
  commercial: "Commercial",
  office: "Office",
};

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex h-44 items-center justify-center bg-slate-100">
        <Image
          src={property.image}
          alt={property.title}
          width={64}
          height={64}
          className="opacity-40"
        />
        {property.featured && (
          <Badge tone="brand" className="absolute left-3 top-3">
            Featured
          </Badge>
        )}
        <Badge tone="success" className="absolute right-3 top-3">
          Admin Approved
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900">
            {property.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {property.locality}, {property.city}
          </p>
        </div>

        <p className="text-lg font-semibold text-brand-700">
          {formatPrice(property.price)}
          {property.purpose === "rent" && (
            <span className="text-sm font-normal text-slate-500"> / month</span>
          )}
        </p>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <Badge tone="neutral">{typeLabels[property.type]}</Badge>
          <Badge tone="neutral">{property.purpose === "sell" ? "For Sale" : "For Rent"}</Badge>
          {property.bedrooms > 0 && <Badge tone="neutral">{property.bedrooms} Bed</Badge>}
          {property.bathrooms > 0 && <Badge tone="neutral">{property.bathrooms} Bath</Badge>}
        </div>

        <div className="mt-auto pt-2">
          <Button href={`/properties/${property.id}`} variant="primary" className="w-full">
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
