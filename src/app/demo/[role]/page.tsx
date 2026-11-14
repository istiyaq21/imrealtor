import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import DashboardCard from "@/components/dashboard/DashboardCard";
import Badge from "@/components/ui/Badge";
import { accessRequests, dashboardStats, enquiries, formatPrice, properties, users } from "@/lib/mock-data";
import type { ListingStatus, Property } from "@/lib/types";

// Read-only demo previews. This route deliberately does not use the real
// Supabase session, privileged dashboard layouts, server actions or API.
type DemoRole = "admin" | "agent" | "owner" | "buyer";
const roles: DemoRole[] = ["admin", "agent", "owner", "buyer"];
const roleNames: Record<DemoRole, string> = {
  admin: "Admin",
  agent: "Agent",
  owner: "Property Owner",
  buyer: "Buyer / Tenant",
};
const tones: Record<ListingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  archived: "neutral",
};
export const metadata: Metadata = {
  title: "Demo Dashboard Preview",
  robots: { index: false, follow: false },
};

export default async function DemoRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  // A local LAN preview is available only from a development build.
  // Production must always return 404 here, even if someone guesses the URL.
  if (process.env.NODE_ENV !== "development") notFound();

  const { role: rawRole } = await params;
  if (!roles.includes(rawRole as DemoRole)) notFound();
  const role = rawRole as DemoRole;

  return (
    <div className="bg-slate-50">
      <PageShell>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <Badge tone="brand">DEMO · MOCK DATA</Badge>
              <p className="mt-2 text-sm font-medium text-slate-900">
                Preview only — actions are disabled, and nothing is saved or sent to Supabase.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-lg border border-brand-300 px-4 py-2 text-center text-sm font-medium text-brand-700 hover:bg-white"
            >
              Exit demo / Real login
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{roleNames[role]} Dashboard Preview</h1>
          <p className="mt-2 text-sm text-slate-600">
            Explore how I&apos;m Realtor looks for each role on mobile and desktop.
          </p>
        </div>
        <nav aria-label="Switch demo role" className="mt-6 flex flex-wrap gap-2">
          {roles.map((item) => (
            <Link
              key={item}
              href={`/demo/${item}`}
              aria-current={item === role ? "page" : undefined}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                item === role
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-300"
              }`}
            >
              {roleNames[item]}
            </Link>
          ))}
        </nav>

        <div className="mt-8 space-y-8">
          {role === "admin" && <AdminPreview />}
          {role === "agent" && <AgentPreview />}
          {role === "owner" && <OwnerPreview />}
          {role === "buyer" && <BuyerPreview />}
        </div>
      </PageShell>
    </div>
  );
}

function StatGrid({ items }: { items: { label: string; value: string | number; hint?: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <DashboardCard key={item.label} {...item} />
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{children}</div>
    </section>
  );
}

function PropertyRows({ rows }: { rows: Property[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((property) => (
        <li key={property.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{property.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {property.locality}, {property.city} · {formatPrice(property.price)}
            </p>
          </div>
          <Badge tone={tones[property.status]}>{property.status}</Badge>
        </li>
      ))}
      {rows.length === 0 && <li className="p-5 text-sm text-slate-500">No sample records.</li>}
    </ul>
  );
}

function AdminPreview() {
  const pending = properties.filter((p) => p.status === "pending");
  return (
    <>
      <StatGrid items={[
        { label: "Total Listings", value: dashboardStats.totalListings },
        { label: "Pending Listings", value: dashboardStats.pendingListings },
        { label: "Approved Agents", value: dashboardStats.approvedAgents },
        { label: "New Enquiries", value: dashboardStats.newEnquiries },
      ]} />
      <Panel title="Pending Property Approvals"><PropertyRows rows={pending} /></Panel>
      <Panel title="Pending Access Requests">
        <ul className="divide-y divide-slate-100">
          {accessRequests.filter((r) => r.status === "pending").map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-medium text-slate-900">{request.fullName}</p>
                <p className="text-xs text-slate-500">{request.city} · Requested: {request.roleRequested}</p>
              </div>
              <Badge tone="warning">Review pending</Badge>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Recent Buyer Enquiries">
        <EnquiryRows items={enquiries} />
      </Panel>
    </>
  );
}

function EnquiryRows({ items }: { items: typeof enquiries }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((enquiry) => (
        <li key={enquiry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="font-medium text-slate-900">{enquiry.buyerName}</p>
            <p className="text-xs text-slate-500">{enquiry.propertyTitle}</p>
          </div>
          <Badge tone={enquiry.status === "new" ? "warning" : "neutral"}>{enquiry.status}</Badge>
        </li>
      ))}
      {items.length === 0 && <li className="p-4 text-sm text-slate-500">No sample enquiries.</li>}
    </ul>
  );
}

function AgentPreview() {
  const assigned = properties.filter((p) => p.assignedAgent === "u2");
  const related = enquiries.filter((e) => assigned.some((p) => p.id === e.propertyId));
  return (
    <>
      <StatGrid items={[
        { label: "Assigned Listings", value: assigned.length },
        { label: "Enquiries Received", value: related.length },
        { label: "Profile Completion", value: "80%" },
        { label: "Follow-ups Due", value: 2 },
      ]} />
      <Panel title="Your Assigned Properties"><PropertyRows rows={assigned} /></Panel>
      <Panel title="Leads & Follow-ups"><EnquiryRows items={related} /></Panel>
    </>
  );
}

function OwnerPreview() {
  const owned = properties.filter((p) => p.ownerId === "u3");
  return (
    <>
      <StatGrid items={[
        { label: "Submitted Properties", value: owned.length },
        { label: "Approved", value: owned.filter((p) => p.status === "approved").length },
        { label: "Pending Review", value: owned.filter((p) => p.status === "pending").length },
        { label: "Enquiries Received", value: enquiries.filter((e) => owned.some((p) => p.id === e.propertyId)).length },
      ]} />
      <Panel title="Your Submitted Properties"><PropertyRows rows={owned} /></Panel>
      <p className="text-sm text-slate-600">
        Live owners can submit properties for admin approval. Submissions are disabled in demo preview.
      </p>
    </>
  );
}

function BuyerPreview() {
  const approved = properties.filter((p) => p.status === "approved");
  const saved = approved.slice(0, 2);
  const buyer = users.find((u) => u.id === "u6");
  const myEnquiries = enquiries.filter((e) => e.buyerName === buyer?.name);
  return (
    <>
      <StatGrid items={[
        { label: "Saved Properties", value: saved.length },
        { label: "Recent Enquiries", value: myEnquiries.length },
        { label: "Recommended", value: approved.length - saved.length },
      ]} />
      <Panel title="Saved Properties"><PropertyRows rows={saved} /></Panel>
      <Panel title="Your Enquiries"><EnquiryRows items={myEnquiries} /></Panel>
      <Panel title="Recommended Properties"><PropertyRows rows={approved.slice(2)} /></Panel>
    </>
  );
}
