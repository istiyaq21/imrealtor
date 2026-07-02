import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";
import PropertyFilters from "@/components/property/PropertyFilters";
import PropertyCard from "@/components/property/PropertyCard";
import EmptyState from "@/components/ui/EmptyState";
import { getPublicApprovedProperties } from "@/lib/services/properties";

export const metadata: Metadata = {
  title: "Properties",
};

interface PropertiesPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    type?: string;
    purpose?: string;
    budget?: string;
    bedrooms?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const city = params.city ?? "";
  const type = params.type ?? "";
  const purpose = params.purpose ?? "";

  const properties = await getPublicApprovedProperties({
    q: params.q,
    city: city || undefined,
    type: type || undefined,
    purpose: purpose ? (purpose as "sell" | "rent") : undefined,
    maxBudget: params.budget ? Number(params.budget) : undefined,
    minBedrooms: params.bedrooms ? Number(params.bedrooms) : undefined,
  });

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
        <p className="mt-2 text-slate-600">
          Browse admin-approved listings from verified agents and owners.
        </p>
      </div>

      <PropertyFilters
        defaultQuery={params.q}
        defaultCity={city}
        defaultType={type}
        defaultPurpose={purpose}
        defaultBudget={params.budget}
        defaultBedrooms={params.bedrooms}
      />

      {properties.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No properties match your filters yet."
          description="Try adjusting your search or check back soon as more listings get approved."
        />
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
