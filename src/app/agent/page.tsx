import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { enquiries, formatPrice, getUserById, properties } from "@/lib/mock-data";
import type { ListingStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Agent Overview",
};

// Demo agent for the private beta (no real auth session yet).
const CURRENT_AGENT_ID = "u2";

const statusTone: Record<ListingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const followUps = [
  { name: "Sneha Iyer", property: "Sunrise Heights 3BHK", due: "Today" },
  { name: "Amit Trivedi", property: "Green Valley Independent Villa", due: "Tomorrow" },
];

export default function AgentOverviewPage() {
  const agent = getUserById(CURRENT_AGENT_ID);
  const assignedListings = properties.filter((p) => p.assignedAgent === CURRENT_AGENT_ID);
  const propertyIds = new Set(assignedListings.map((p) => p.id));
  const relatedEnquiries = enquiries.filter((e) => propertyIds.has(e.propertyId));
  const profileCompletion = 80;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {agent?.name ?? "Agent"}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Here&apos;s an overview of your assigned listings and enquiries.
          </p>
        </div>
        <Button href="/agent/listings">Add Listing</Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Assigned Listings" value={assignedListings.length} />
        <DashboardCard label="Enquiries Received" value={relatedEnquiries.length} />
        <DashboardCard label="Profile Completion" value={`${profileCompletion}%`} hint="Add more details to reach 100%" />
        <DashboardCard label="Follow-ups Due" value={followUps.length} />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Assigned Listings</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {assignedListings.map((property) => (
                <tr key={property.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/properties/${property.id}`} className="hover:text-brand-600">
                      {property.title}
                    </Link>
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
              {assignedListings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No listings assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Enquiries Received</h2>
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

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Lead Follow-up Reminders</h2>
        <div className="space-y-3">
          {followUps.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.property}</p>
              </div>
              <Badge tone="warning">Due {item.due}</Badge>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
