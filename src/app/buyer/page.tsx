import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PropertyCard from "@/components/property/PropertyCard";
import { enquiries, getApprovedProperties, getUserById } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Buyer Overview",
};

const CURRENT_BUYER_ID = "u6";

export default function BuyerOverviewPage() {
  const buyer = getUserById(CURRENT_BUYER_ID);
  const approvedProperties = getApprovedProperties();
  const savedProperties = approvedProperties.slice(0, 2);
  const recommended = approvedProperties.slice(2, 5);
  const myEnquiries = enquiries.filter((e) => e.buyerName === buyer?.name);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {buyer?.name ?? "Buyer"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Explore recommended properties and track your enquiries.
          </p>
        </div>
        <Button href="/properties">Browse Properties</Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <DashboardCard label="Saved Properties" value={savedProperties.length} />
        <DashboardCard label="Recent Enquiries" value={myEnquiries.length} />
        <DashboardCard label="Recommended for You" value={recommended.length} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Saved Properties</h2>
        {savedProperties.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            You haven&apos;t saved any properties yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Enquiries</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {myEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{enquiry.propertyTitle}</td>
                  <td className="px-4 py-3 line-clamp-1 text-slate-600">{enquiry.message}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral" className="capitalize">
                      {enquiry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {myEnquiries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No enquiries yet. Browse properties to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recommended Properties</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  );
}
