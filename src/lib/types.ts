// Shared domain types for I'm Realtor (private beta MVP).
// TODO(supabase): once Supabase is connected, these types should mirror
// generated database types (e.g. via `supabase gen types typescript`).

export type UserRole = "admin" | "agent" | "owner" | "buyer" | "support";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "archived";

export type PropertyPurpose = "sell" | "rent";

export type PropertyType =
  | "apartment"
  | "villa"
  | "independent-house"
  | "plot"
  | "commercial"
  | "office";

export interface Property {
  id: string;
  slug?: string;
  title: string;
  city: string;
  locality: string;
  price: number;
  purpose: PropertyPurpose;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  area: number; // sq. ft.
  status: ListingStatus;
  featured: boolean;
  image: string;
  description: string;
  amenities: string[];
  assignedAgent: string | null; // agent id
  ownerId: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: ApprovalStatus;
  city: string;
  joinedAt: string;
}

export interface AccessRequest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  roleRequested: Exclude<UserRole, "admin" | "support">;
  city: string;
  message: string;
  status: ApprovalStatus;
  createdAt: string;
}

export type EnquiryStatus = "new" | "contacted" | "closed" | "spam";

export interface Enquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  phone: string;
  email: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface DashboardStats {
  totalListings: number;
  pendingListings: number;
  approvedAgents: number;
  newEnquiries: number;
}
