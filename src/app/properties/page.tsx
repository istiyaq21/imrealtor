import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";
import PropertyFilters from "@/components/property/PropertyFilters";
import PropertyCard from "@/components/property/PropertyCard";
import { getApprovedProperties } from "@/lib/mock-data";

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
  const q = params.q?.trim().toLowerCase() ?? "";
  const city = params.city ?? "";
  const type = params.type ?? "";
  const purpose = params.purpose ?? "";
  const budget = params.budget ? Number(params.budget) : undefined;
  const bedrooms = params.bedrooms ? Number(params.bedrooms) : undefined;

  const properties = getApprovedProperties().filter((property) => {
    if (q) {
      const haystack = `${property.title} ${property.city} ${property.locality}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (city && property.city !== city) return false;
    if (type && property.type !== type) return false;
    if (purpose && property.purpose !== purpose) return false;
    if (budget && property.price > budget) return false;
    if (bedrooms && property.bedrooms < bedrooms) return false;
    return true;
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
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
          No properties match your filters yet. Try adjusting your search.
        </div>
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
