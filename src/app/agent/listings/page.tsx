import type { Metadata } from "next";
import AgentListingsPanel from "@/components/agent/AgentListingsPanel";
import { properties } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "My Listings",
};

const CURRENT_AGENT_ID = "u2";

export default function AgentListingsPage() {
  const listings = properties.filter((p) => p.assignedAgent === CURRENT_AGENT_ID);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your assigned and submitted listings.</p>
      </div>
      <AgentListingsPanel listings={listings} />
    </div>
  );
}
