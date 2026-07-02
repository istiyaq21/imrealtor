// Aggregated dashboard stats per role. Admin stats use direct count
// queries (cheap, no row data fetched); agent/owner/buyer stats reuse the
// existing list functions and just take `.length`, since those datasets
// are small and it avoids duplicating filtering logic.

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { dashboardStats as mockDashboardStats } from "@/lib/mock-data";
import type { DashboardStats } from "@/lib/types";
import { listPropertiesForAgent, listPropertiesForOwner } from "./properties";
import { listEnquiriesForAgent, listEnquiriesForBuyer, listEnquiriesForOwner } from "./enquiries";
import { listSavedPropertiesForBuyer } from "./saved-properties";

export interface AgentDashboardStats {
  assignedListings: number;
  enquiriesReceived: number;
}

export interface OwnerDashboardStats {
  submittedProperties: number;
  approved: number;
  pending: number;
  enquiriesReceived: number;
}

export interface BuyerDashboardStats {
  savedProperties: number;
  recentEnquiries: number;
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockDashboardStats;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockDashboardStats;

  const [totalListings, pendingListings, approvedAgents, newEnquiries] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "agent").eq("status", "approved"),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return {
    totalListings: totalListings.count ?? 0,
    pendingListings: pendingListings.count ?? 0,
    approvedAgents: approvedAgents.count ?? 0,
    newEnquiries: newEnquiries.count ?? 0,
  };
}

export async function getAgentDashboardStats(agentId: string): Promise<AgentDashboardStats> {
  const [listings, enquiries] = await Promise.all([
    listPropertiesForAgent(agentId),
    listEnquiriesForAgent(agentId),
  ]);

  return {
    assignedListings: listings.length,
    enquiriesReceived: enquiries.length,
  };
}

export async function getOwnerDashboardStats(ownerId: string): Promise<OwnerDashboardStats> {
  const [properties, enquiries] = await Promise.all([
    listPropertiesForOwner(ownerId),
    listEnquiriesForOwner(ownerId),
  ]);

  return {
    submittedProperties: properties.length,
    approved: properties.filter((p) => p.status === "approved").length,
    pending: properties.filter((p) => p.status === "pending").length,
    enquiriesReceived: enquiries.length,
  };
}

export async function getBuyerDashboardStats(buyerId: string): Promise<BuyerDashboardStats> {
  const [saved, enquiries] = await Promise.all([
    listSavedPropertiesForBuyer(buyerId),
    listEnquiriesForBuyer(buyerId),
  ]);

  return {
    savedProperties: saved.length,
    recentEnquiries: enquiries.length,
  };
}
