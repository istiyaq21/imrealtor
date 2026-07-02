// Local mock data for the private beta MVP.
// TODO(supabase): replace all of this with Supabase queries once the
// database is connected. Keep the shapes in src/lib/types.ts stable so
// swapping the data layer doesn't require touching UI components.

import type {
  AccessRequest,
  AppUser,
  DashboardStats,
  Enquiry,
  Property,
} from "./types";

export const properties: Property[] = [
  {
    id: "p1",
    title: "Sunrise Heights 3BHK",
    city: "Mumbai",
    locality: "Andheri West",
    price: 21500000,
    purpose: "sell",
    type: "apartment",
    bedrooms: 3,
    bathrooms: 3,
    area: 1450,
    status: "approved",
    featured: true,
    image: "/window.svg",
    description:
      "A well-ventilated 3BHK apartment in a gated society with clubhouse, landscaped gardens, and 24x7 security. Close to metro and schools.",
    amenities: ["Clubhouse", "24x7 Security", "Power Backup", "Covered Parking", "Gym"],
    assignedAgent: "u2",
    ownerId: "u3",
    createdAt: "2026-05-02",
  },
  {
    id: "p2",
    title: "Green Valley Independent Villa",
    city: "Bengaluru",
    locality: "Whitefield",
    price: 45000000,
    purpose: "sell",
    type: "villa",
    bedrooms: 4,
    bathrooms: 4,
    area: 3200,
    status: "approved",
    featured: true,
    image: "/window.svg",
    description:
      "Spacious independent villa with private garden and terrace, located in a quiet, family-friendly neighborhood near tech parks.",
    amenities: ["Private Garden", "Terrace", "Servant Quarters", "2 Car Parking"],
    assignedAgent: "u2",
    ownerId: "u4",
    createdAt: "2026-05-10",
  },
  {
    id: "p3",
    title: "Lakeview 2BHK for Rent",
    city: "Pune",
    locality: "Hinjewadi",
    price: 32000,
    purpose: "rent",
    type: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    area: 1080,
    status: "approved",
    featured: false,
    image: "/window.svg",
    description:
      "Semi-furnished 2BHK close to IT parks, ideal for working professionals. Society offers gym and children's play area.",
    amenities: ["Gym", "Play Area", "Lift", "Power Backup"],
    assignedAgent: "u5",
    ownerId: "u4",
    createdAt: "2026-06-01",
  },
  {
    id: "p4",
    title: "Central Business Office Space",
    city: "Delhi",
    locality: "Connaught Place",
    price: 180000,
    purpose: "rent",
    type: "office",
    bedrooms: 0,
    bathrooms: 2,
    area: 2000,
    status: "approved",
    featured: false,
    image: "/window.svg",
    description:
      "Premium office space in the heart of the business district. Fully air-conditioned with 24x7 access and parking.",
    amenities: ["24x7 Access", "Parking", "Conference Room", "Pantry"],
    assignedAgent: "u2",
    ownerId: "u3",
    createdAt: "2026-06-05",
  },
  {
    id: "p5",
    title: "Riverside Plot",
    city: "Hyderabad",
    locality: "Shamshabad",
    price: 8500000,
    purpose: "sell",
    type: "plot",
    bedrooms: 0,
    bathrooms: 0,
    area: 2400,
    status: "pending",
    featured: false,
    image: "/window.svg",
    description:
      "Clear-title residential plot near the upcoming ring road expansion, suitable for independent house construction.",
    amenities: ["Clear Title", "Gated Layout", "Water Connection"],
    assignedAgent: null,
    ownerId: "u4",
    createdAt: "2026-06-20",
  },
  {
    id: "p6",
    title: "Palm Residency 1BHK",
    city: "Mumbai",
    locality: "Malad East",
    price: 9500000,
    purpose: "sell",
    type: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    area: 620,
    status: "pending",
    featured: false,
    image: "/window.svg",
    description:
      "Compact and efficient 1BHK, perfect for a small family or first-time buyer. Close to railway station.",
    amenities: ["Lift", "Security", "Near Station"],
    assignedAgent: null,
    ownerId: "u3",
    createdAt: "2026-06-25",
  },
  {
    id: "p7",
    title: "Heritage Bungalow",
    city: "Jaipur",
    locality: "Civil Lines",
    price: 62000000,
    purpose: "sell",
    type: "independent-house",
    bedrooms: 5,
    bathrooms: 5,
    area: 4800,
    status: "draft",
    featured: false,
    image: "/window.svg",
    description:
      "Restored heritage bungalow with modern interiors, large courtyard, and vintage architecture in a prime central location.",
    amenities: ["Courtyard", "Heritage Architecture", "Private Parking"],
    assignedAgent: null,
    ownerId: "u4",
    createdAt: "2026-06-28",
  },
  {
    id: "p8",
    title: "Tech Park Commercial Unit",
    city: "Pune",
    locality: "Kharadi",
    price: 15000000,
    purpose: "sell",
    type: "commercial",
    bedrooms: 0,
    bathrooms: 1,
    area: 950,
    status: "rejected",
    featured: false,
    image: "/window.svg",
    description:
      "Ground floor commercial unit suitable for retail or clinic use, in a busy tech-park-adjacent commercial complex.",
    amenities: ["High Footfall", "Parking", "Power Backup"],
    assignedAgent: null,
    ownerId: "u3",
    createdAt: "2026-06-15",
  },
];

export const users: AppUser[] = [
  {
    id: "u1",
    name: "Vishal Sharma",
    email: "admin@imrealtor.app",
    phone: "+91 90000 00001",
    role: "admin",
    status: "approved",
    city: "Mumbai",
    joinedAt: "2026-04-01",
  },
  {
    id: "u2",
    name: "Ananya Kapoor",
    email: "ananya.agent@imrealtor.app",
    phone: "+91 90000 00002",
    role: "agent",
    status: "approved",
    city: "Mumbai",
    joinedAt: "2026-04-10",
  },
  {
    id: "u3",
    name: "Rahul Mehta",
    email: "rahul.owner@imrealtor.app",
    phone: "+91 90000 00003",
    role: "owner",
    status: "approved",
    city: "Mumbai",
    joinedAt: "2026-04-15",
  },
  {
    id: "u4",
    name: "Priya Nair",
    email: "priya.owner@imrealtor.app",
    phone: "+91 90000 00004",
    role: "owner",
    status: "approved",
    city: "Bengaluru",
    joinedAt: "2026-04-20",
  },
  {
    id: "u5",
    name: "Karan Malhotra",
    email: "karan.agent@imrealtor.app",
    phone: "+91 90000 00005",
    role: "agent",
    status: "pending",
    city: "Pune",
    joinedAt: "2026-06-01",
  },
  {
    id: "u6",
    name: "Sneha Iyer",
    email: "sneha.buyer@imrealtor.app",
    phone: "+91 90000 00006",
    role: "buyer",
    status: "approved",
    city: "Pune",
    joinedAt: "2026-05-05",
  },
  {
    id: "u7",
    name: "Farhan Sheikh",
    email: "farhan.agent@imrealtor.app",
    phone: "+91 90000 00007",
    role: "agent",
    status: "suspended",
    city: "Delhi",
    joinedAt: "2026-04-25",
  },
];

export const accessRequests: AccessRequest[] = [
  {
    id: "ar1",
    fullName: "Meera Joshi",
    phone: "+91 90000 10001",
    email: "meera.joshi@example.com",
    roleRequested: "agent",
    city: "Ahmedabad",
    message: "10+ years experience in residential real estate, looking to onboard as a verified agent.",
    status: "pending",
    createdAt: "2026-06-27",
  },
  {
    id: "ar2",
    fullName: "Vikram Desai",
    phone: "+91 90000 10002",
    email: "vikram.desai@example.com",
    roleRequested: "owner",
    city: "Surat",
    message: "I want to list my 2 residential properties for sale.",
    status: "pending",
    createdAt: "2026-06-29",
  },
  {
    id: "ar3",
    fullName: "Ritu Bansal",
    phone: "+91 90000 10003",
    email: "ritu.bansal@example.com",
    roleRequested: "buyer",
    city: "Mumbai",
    message: "Looking for a 2BHK in Andheri or Bandra within budget.",
    status: "approved",
    createdAt: "2026-06-18",
  },
];

export const enquiries: Enquiry[] = [
  {
    id: "e1",
    propertyId: "p1",
    propertyTitle: "Sunrise Heights 3BHK",
    buyerName: "Sneha Iyer",
    phone: "+91 90000 00006",
    email: "sneha.buyer@imrealtor.app",
    message: "Is this property still available? Would like to schedule a visit this weekend.",
    status: "new",
    createdAt: "2026-06-30",
  },
  {
    id: "e2",
    propertyId: "p2",
    propertyTitle: "Green Valley Independent Villa",
    buyerName: "Amit Trivedi",
    phone: "+91 90000 20002",
    email: "amit.trivedi@example.com",
    message: "Interested in this villa. Please share the floor plan.",
    status: "contacted",
    createdAt: "2026-06-28",
  },
  {
    id: "e3",
    propertyId: "p4",
    propertyTitle: "Central Business Office Space",
    buyerName: "Neha Kulkarni",
    phone: "+91 90000 20003",
    email: "neha.kulkarni@example.com",
    message: "Looking for a 6-month short lease option, is that possible?",
    status: "closed",
    createdAt: "2026-06-20",
  },
  {
    id: "e4",
    propertyId: "p3",
    propertyTitle: "Lakeview 2BHK for Rent",
    buyerName: "Rohan Bhatt",
    phone: "+91 90000 20004",
    email: "rohan.bhatt@example.com",
    message: "Can the rent be negotiated slightly? Also need parking for 2 bikes.",
    status: "new",
    createdAt: "2026-07-01",
  },
];

export const dashboardStats: DashboardStats = {
  totalListings: properties.length,
  pendingListings: properties.filter((p) => p.status === "pending").length,
  approvedAgents: users.filter((u) => u.role === "agent" && u.status === "approved").length,
  newEnquiries: enquiries.filter((e) => e.status === "new").length,
};

export function getApprovedProperties(): Property[] {
  return properties.filter((p) => p.status === "approved");
}

export function getFeaturedProperties(): Property[] {
  return properties.filter((p) => p.status === "approved" && p.featured);
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function getUserById(id: string): AppUser | undefined {
  return users.find((u) => u.id === id);
}

export function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString("en-IN")}`;
}
