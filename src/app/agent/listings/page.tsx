import type { Metadata } from "next";
import AgentListingsPanel from "@/components/agent/AgentListingsPanel";
import { getCurrentProfile } from "@/lib/auth/session";
import { listPropertiesForAgent } from "@/lib/services/properties";

export const metadata: Metadata = {
  title: "My Listings",
};

export default async function AgentListingsPage() {
  const profile = await getCurrentProfile();
  const agentId = profile?.id ?? "u2";
  const listings = await listPropertiesForAgent(agentId);

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
