import type { Metadata } from "next";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PendingListingsTable from "@/components/admin/PendingListingsTable";
import PendingAccessRequestsTable from "@/components/admin/PendingAccessRequestsTable";
import RecentEnquiriesTable from "@/components/admin/RecentEnquiriesTable";
import Button from "@/components/ui/Button";
import { accessRequests, dashboardStats, enquiries, properties } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Admin Overview",
};

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review pending listings, access requests, and recent buyer enquiries.
          </p>
        </div>
        <div className="flex gap-3">
          <Button href="/admin/listings" variant="outline" size="sm">
            Manage Listings
          </Button>
          <Button href="/admin/users" size="sm">
            Manage Users
          </Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="Total Listings" value={dashboardStats.totalListings} />
        <DashboardCard label="Pending Listings" value={dashboardStats.pendingListings} hint="Awaiting review" />
        <DashboardCard label="Approved Agents" value={dashboardStats.approvedAgents} />
        <DashboardCard label="New Enquiries" value={dashboardStats.newEnquiries} hint="Not yet contacted" />
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Listing Approvals</h2>
        <PendingListingsTable initialListings={properties} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Pending Access Requests</h2>
        <PendingAccessRequestsTable initialRequests={accessRequests} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Enquiries</h2>
        <RecentEnquiriesTable enquiries={enquiries} />
      </section>
    </div>
  );
}
