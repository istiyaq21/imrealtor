import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { getCurrentProfile } from "@/lib/auth/session";
import { listPropertiesForOwner } from "@/lib/services/properties";
import { listEnquiriesForOwner } from "@/lib/services/enquiries";
import { formatPrice } from "@/lib/mock-data";
import type { ListingStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Owner Overview",
};

const statusTone: Record<ListingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  archived: "neutral",
};

// The admin/agent/owner/buyer layouts already call requireApprovedRole()
// before this page renders, so getCurrentProfile() here is guaranteed to
// return an approved owner profile (or, in mock mode, null — handled
// below with a safe fallback rather than assuming non-null).
export default async function OwnerOverviewPage() {
  const profile = await getCurrentProfile();
  const ownerId = profile?.id ?? "u3"; // mock-mode fallback owner id

  const [submittedProperties, relatedEnquiries] = await Promise.all([
    listPropertiesForOwner(ownerId),
    listEnquiriesForOwner(ownerId),
  ]);

  const approvedCount = submittedProperties.filter((p) => p.status === "approved").length;
  const pendingCount = submittedProperties.filter((p) => p.status === "pending").length;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name ?? "Owner"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track the review status of your submitted properties.
          </p>
        </div>
        <Button href="/owner/submit-property">Submit New Property</Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Submitted Properties" value={submittedProperties.length} />
        <DashboardCard label="Approved" value={approvedCount} />
        <DashboardCard label="Pending Review" value={pendingCount} />
        <DashboardCard label="Enquiries Received" value={relatedEnquiries.length} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Submitted Properties</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {submittedProperties.map((property) => (
                <tr key={property.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {property.status === "approved" ? (
                      <Link href={`/properties/${property.id}`} className="hover:text-brand-600">
                        {property.title}
                      </Link>
                    ) : (
                      property.title
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{property.city}</td>
                  <td className="px-4 py-3 text-slate-600">{formatPrice(property.price)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[property.status]} className="capitalize">
                      {property.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {submittedProperties.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    You haven&apos;t submitted any properties yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Enquiries Summary</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {relatedEnquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{enquiry.buyerName}</td>
                  <td className="px-4 py-3 text-slate-600">{enquiry.propertyTitle}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral" className="capitalize">
                      {enquiry.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {relatedEnquiries.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No enquiries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
